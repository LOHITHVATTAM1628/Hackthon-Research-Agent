import { NextRequest, NextResponse } from 'next/server';
import { callGroq } from '@/lib/agents/llm';
import { searchTavily } from '@/lib/agents/search';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      chatType = 'report',
      messages = [],
      reportContext = '',
      topic = 'Autonomous Research Inquiry',
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || '';

    // =========================================================================
    // MODE 1: REPORT EVOLUTION & INQUIRY ASSISTANT
    // =========================================================================
    if (chatType === 'report') {
      const systemPrompt = `You are the Report Evolution & Intelligence Assistant for the Multi-Agent Research System.
You are grounded in the following finalized autonomous research report on "${topic}":

=== REPORT BEGIN ===
${reportContext.substring(0, 3500)}
=== REPORT END ===

Guidelines:
1. Answer the researcher's questions with rigor, technical clarity, and precision.
2. Ground your explanations in the data, methodologies, and limitations present in the report.
3. If asked for executive summaries, comparison tables, or section rewrites, generate them directly.
4. If an answer cannot be deduced from the report, acknowledge it and suggest how a future research swarm could investigate it.`;

      const chatMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.slice(-6).map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ];

      const reply = await callGroq(chatMessages, { temperature: 0.3, max_tokens: 750 });
      return NextResponse.json({
        role: 'assistant',
        content: reply,
        chatType: 'report',
      });
    }

    // =========================================================================
    // MODE 2: AUTONOMOUS WEB EXPLORER ASSISTANT
    // =========================================================================
    let webContext = '';
    const discoveredSources: Array<{ title: string; url: string }> = [];

    // Trigger live Tavily search to supplement exploration
    try {
      const searchResults = await searchTavily(`${topic} ${lastUserMessage}`, 3);
      if (searchResults && searchResults.length > 0) {
        webContext = searchResults
          .map((s, i) => `[Web Source ${i + 1}] ${s.title} (${s.url}):\n${s.content}`)
          .join('\n\n');

        searchResults.forEach((s) => {
          discoveredSources.push({ title: s.title, url: s.url });
        });
      }
    } catch (searchErr) {
      console.warn('Explorer web search fallback:', searchErr);
    }

    const explorerSystemPrompt = `You are the Autonomous Web Explorer Assistant in the Multi-Agent Research System.
Your mission is open-ended scientific brainstorming, exploring tangential disciplines, checking market dynamics, and finding real-world implementations.

Current Subject: "${topic}"

LIVE WEB SEARCH CONTEXT:
${webContext || 'No additional web search results returned.'}

Guidelines:
1. Provide visionary, technologically rigorous, and insightful answers.
2. Incorporate the live web results where relevant and cite them as [Source 1], [Source 2].
3. Propose concrete hypotheses, testable architectures, and next-step research trajectories.`;

    const chatMessages = [
      { role: 'system' as const, content: explorerSystemPrompt },
      ...messages.slice(-6).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const reply = await callGroq(chatMessages, { temperature: 0.4, max_tokens: 800 });

    return NextResponse.json({
      role: 'assistant',
      content: reply,
      chatType: 'explorer',
      sources: discoveredSources,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Chat API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
