import os
from langchain.agents import create_agent
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda
from tools import web_search , scrape_url 
from dotenv import load_dotenv

load_dotenv(override=True)

def get_llm():
    load_dotenv(override=True)
    groq_api_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    max_tokens = int(os.getenv("GROQ_MAX_TOKENS", "700"))
    return ChatGroq(model=groq_model, temperature=0, groq_api_key=groq_api_key, max_tokens=max_tokens)

# 1st agent 
def build_search_agent():
    return create_agent(
        model=get_llm(),
        tools=[web_search]
    )

# 2nd agent 

def build_reader_agent():
    return create_agent(
        model=get_llm(),
        tools=[scrape_url]
    )


#writer chain 

writer_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert research writer. Write clear, structured and insightful reports."),
    ("human", """Write a detailed research report on the topic below.

Topic: {topic}

Research Gathered:
{research}

Structure the report as:
- Introduction
- Key Findings (minimum 3 well-explained points)
- Conclusion
- Sources (list all URLs found in the research)

Be detailed, factual and professional."""),
])

writer_chain = writer_prompt | RunnableLambda(lambda x: get_llm().invoke(x)) | StrOutputParser()

#critic_chain 

critic_prompt = ChatPromptTemplate.from_messages([
     ("system", "You are a sharp and constructive research critic. Be honest and specific."),
    ("human", """Review the research report below and evaluate it strictly.

Report:
{report}

Respond in this exact format:

Score: X/10

Strengths:
- ...
- ...

Areas to Improve:
- ...
- ...

One line verdict:
..."""),
])

critic_chain = critic_prompt | RunnableLambda(lambda x: get_llm().invoke(x)) | StrOutputParser()

