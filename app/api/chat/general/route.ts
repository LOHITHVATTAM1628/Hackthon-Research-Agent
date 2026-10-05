import { NextRequest, NextResponse } from 'next/server';
import { streamGroqTokens, callGroq, ChatMessage } from '@/lib/agents/llm';
import { searchTavily, TavilySearchResult } from '@/lib/agents/search';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper to determine if query needs live web search
function queryRequiresSearch(query: string): boolean {
  const triggers = [
    'latest',
    'recent',
    'new',
    'current',
    '2025',
    '2026',
    'news',
    'update',
    'breakthrough',
    'benchmark',
    'paper',
    'state of the art',
    'sota',
    'compare',
    'vs',
    'market',
    'trend',
    'pricing',
    'trial',
  ];
  const lower = query.toLowerCase();
  return triggers.some((t) => lower.includes(t)) || query.length > 50;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      message,
      query: altQuery,
      history = [],
      stream = true,
      enableWebSearch = true,
    } = body;

    const userMessage = message || altQuery;
    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json({ error: 'User message is required' }, { status: 400 });
    }

    // 1. Dynamic Web Search Evaluation
    let sources: TavilySearchResult[] = [];
    const shouldSearch = enableWebSearch && queryRequiresSearch(userMessage);

    if (shouldSearch) {
      try {
        const searchResults = await searchTavily(userMessage, 3);
        sources = searchResults;
      } catch (sErr) {
        console.warn('[chat/general] Web search error:', sErr);
      }
    }

    // 2. Format System Prompt
    let contextAddition = '';
    if (sources.length > 0) {
      contextAddition = `\n\nAUTHORITATIVE LIVE WEB INTELLIGENCE RETRIEVED:\n` +
        sources
          .map(
            (s, i) =>
              `[Source ${i + 1}] "${s.title}" (${s.url})\nPublished: ${s.published_date || 'Recent'}\n${s.content}`
          )
          .join('\n\n') +
        `\n\nUse the above live web findings to enrich your answer. When stating claims based on these sources, cite them with markdown links like [Source Title](URL).`;
    }

    const systemPrompt = `You are ResearchMind General Assistant, an elite multi-agent research partner and principal scientific investigator.

YOUR CAPABILITIES:
- Open-ended autonomous research across any technology, science, economics, medicine, and engineering topic.
- In-depth architectural breakdowns, empirical comparisons, mathematical explanations, and code implementations.
- Evidence-based hypothesis evaluation and critical peer-review synthesis.

STYLE & FORMATTING:
- Use clean, modern Markdown with bold headings (###), bullet points, and callouts.
- When comparing options or protocols, provide clear Markdown comparison tables.
- Include concise, runnable code blocks or architecture diagrams where helpful.
- Be precise, technical, objective, and authoritative. Avoid generic superficial overviews.${contextAddition}`;

    const groqMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        if (h.role === 'user' || h.role === 'assistant') {
          groqMessages.push({ role: h.role, content: String(h.content) });
        }
      }
    }

    groqMessages.push({ role: 'user', content: userMessage });

    // 3. Streaming SSE or JSON
    if (stream) {
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            // If sources were retrieved, send sources event
            if (sources.length > 0) {
              const srcData = JSON.stringify({
                type: 'sources',
                sources: sources.map((s) => ({
                  title: s.title,
                  url: s.url,
                  snippet: s.content.substring(0, 160) + '...',
                })),
              });
              controller.enqueue(encoder.encode(`data: ${srcData}\n\n`));
            }

            // Stream tokens
            for await (const token of streamGroqTokens(groqMessages, { temperature: 0.4 })) {
              const tokenPayload = JSON.stringify({ type: 'token', content: token });
              controller.enqueue(encoder.encode(`data: ${tokenPayload}\n\n`));
            }

            controller.enqueue(encoder.encode(`data: {"type": "done"}\n\n`));
            controller.close();
          } catch (streamErr: unknown) {
            const err = streamErr instanceof Error ? streamErr : new Error(String(streamErr));
            controller.enqueue(encoder.encode(`data: {"type": "error", "error": "${err.message}"}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(customReadable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    // Non-streaming fallback
    const answer = await callGroq(groqMessages, { temperature: 0.4 });
    return NextResponse.json({
      success: true,
      answer,
      sources,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error in general chat API:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
