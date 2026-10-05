import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { streamGroqTokens, callGroq, ChatMessage } from '@/lib/agents/llm';
import { searchTavily, TavilySearchResult } from '@/lib/agents/search';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const isPlaceholderUrl = (url?: string) =>
  !url || url.includes('your-project-id') || url.includes('placeholder');

export interface ReportOption {
  id: string;
  projectId: string;
  topic: string;
  version: number;
  createdAt: string;
  summary?: string;
  content?: string;
}

const FALLBACK_REPORTS: ReportOption[] = [
  {
    id: 'rep-a4a311b9-4284-4374-a856-f78217e022ea-v2',
    projectId: 'a4a311b9-4284-4374-a856-f78217e022ea',
    topic: 'Autonomous Multi-Agent System Architectures & Consensus in 2026',
    version: 2,
    createdAt: '2026-10-05T17:02:45.000Z',
    summary: 'Decentralized consensus, sub-second gossip algorithms, and verifiable cryptographic telemetry.',
    content: `# Autonomous Multi-Agent Systems: Version 2.0 Comprehensive Report\n\n## Executive Summary\nRecent 2026 advancements in Autonomous Multi-Agent Systems demonstrated decentralized peer-to-peer consensus and reactive asynchronous message routing. System throughput increased by 3.8x with critic loop containment.\n\n## Core Technical Findings\n- Sub-second gossip consensus protocols achieve 42% lower inter-agent latency.\n- Merkle-tree cryptographic telemetry guarantees verifiable execution.\n- 4-bit edge critic models suppress hallucination within 15ms.\n\n## Limitations & Future Work\nNetwork partitions in high-concurrency swarms remain an edge-case risk.`,
  },
  {
    id: 'rep-healthcare-v2',
    projectId: 'proj-healthcare-diagnostics',
    topic: 'Impact of AI on Healthcare Diagnostics',
    version: 2,
    createdAt: '2026-10-05T13:00:00.000Z',
    summary: 'Clinical multi-modal foundation models and real-time histopathology validation.',
    content: `# Impact of AI on Healthcare Diagnostics: Version 2.0\n\n## Executive Summary\nAI-assisted diagnostics have advanced to autonomous multi-modal triage. Recent studies show 97.4% sensitivity in early-stage oncology detection when paired with human-in-the-loop validation.\n\n## Core Clinical Findings\n- Multi-modal vision transformers detect micro-calcifications 18 months earlier than traditional imaging.\n- Federated edge deployments protect patient health information (PHI).\n\n## Regulatory Landscape\nFDA guidelines updated in late 2025 require dynamic drift monitoring and continuous audit logging.`,
  },
  {
    id: 'rep-battery-v1',
    projectId: 'proj-solid-state-battery',
    topic: 'Solid-State Battery Energy Density & Production Bottlenecks',
    version: 1,
    createdAt: '2026-09-29T10:35:00.000Z',
    summary: 'Sulfide-based solid electrolytes, dendrite suppression, and roll-to-roll manufacturing.',
    content: `# Solid-State Battery Energy Density & Production Bottlenecks: Version 1.0\n\n## Executive Summary\nSolid-state batteries promise energy densities exceeding 450 Wh/kg. However, roll-to-roll electrolyte membrane manufacturing remains the primary cost bottleneck.\n\n## Key Assertions\n- Sulfide electrolytes offer highest ionic conductivity (10^-2 S/cm) but degrade upon atmospheric moisture contact.\n- High stack pressure (>5 MPa) is currently required to prevent void formation during cycling.\n\n## Production Milestones\nCommercial pilot lines slated for 2027 by leading automotive consortiums.`,
  },
];

// GET: Returns list of available reports for dropdown selection
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!isPlaceholderUrl(supabaseUrl)) {
    try {
      const { data, error } = await supabaseAdmin
        .from('reports')
        .select('id, version, created_at, content, research_project_id, research_projects(id, topic, status)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        const mapped: ReportOption[] = data.map((r: any) => {
          const proj = Array.isArray(r.research_projects) ? r.research_projects[0] : r.research_projects;
          return {
            id: r.id,
            projectId: r.research_project_id || proj?.id || '',
            topic: proj?.topic || 'Research Report',
            version: r.version || 1,
            createdAt: r.created_at,
            content: r.content,
            summary: r.content ? r.content.substring(0, 160).replace(/[#*`\n]/g, ' ') + '...' : undefined,
          };
        });
        return NextResponse.json({ reports: mapped });
      }
    } catch (err) {
      console.warn('[chat/compare GET] Supabase reports fetch fallback:', err);
    }
  }

  return NextResponse.json({ reports: FALLBACK_REPORTS });
}

// POST: Answers evolution & audit questions against a grounded report
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      reportId,
      projectId,
      reportContent: rawContent,
      reportTitle: rawTitle,
      message,
      query: altQuery,
      history = [],
      stream = true,
    } = body;

    const userQuery = message || altQuery;
    if (!userQuery || typeof userQuery !== 'string') {
      return NextResponse.json({ error: 'User message or query is required' }, { status: 400 });
    }

    // 1. Resolve Ground-Truth Report
    let topic = rawTitle || 'Autonomous Multi-Agent Systems';
    let content = rawContent || '';
    let version = 1;
    let createdAtDate = 'October 2026';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!content && reportId && !isPlaceholderUrl(supabaseUrl)) {
      try {
        const { data: rep } = await supabaseAdmin
          .from('reports')
          .select('*, research_projects(topic, created_at)')
          .eq('id', reportId)
          .maybeSingle();

        if (rep) {
          content = rep.content || '';
          version = rep.version || 1;
          createdAtDate = rep.created_at || 'Recent';
          const p = Array.isArray(rep.research_projects) ? rep.research_projects[0] : rep.research_projects;
          if (p?.topic) topic = p.topic;
        }
      } catch (err) {
        console.warn('[chat/compare] Report fetch fallback:', err);
      }
    }

    // Fallback if content still not found
    if (!content) {
      const match = FALLBACK_REPORTS.find((r) => r.id === reportId || r.projectId === projectId);
      const chosen = match || FALLBACK_REPORTS[0];
      topic = chosen.topic;
      content = chosen.content || '';
      version = chosen.version;
      createdAtDate = chosen.createdAt;
    }

    // 2. Perform Targeted Live Search via Tavily
    const targetedSearchQueries = [
      `${topic} latest news 2026 developments breakthroughs`,
      `${topic} recent updates benchmarks controversies`,
    ];

    const sources: TavilySearchResult[] = [];
    for (const q of targetedSearchQueries) {
      try {
        const res = await searchTavily(q, 2);
        for (const item of res) {
          if (!sources.some((s) => s.url === item.url)) {
            sources.push(item);
          }
        }
      } catch (err) {
        console.warn('[chat/compare] Tavily search error:', err);
      }
    }

    const freshSourcesSummary =
      sources.length > 0
        ? sources
            .map(
              (s, i) =>
                `[Source ${i + 1}] "${s.title}" (${s.url})\nPublished: ${s.published_date || 'Recent'}\n${s.content}`
            )
            .join('\n\n')
        : 'No external web citations retrieved; performing grounded evolutionary analysis based on foundational literature.';

    // 3. Assemble Grounded Prompt
    const systemPrompt = `You are the Senior Research Evolution & Report Comparison Specialist in the ResearchMind Autonomous Multi-Agent System.

YOUR ROLE:
You audit existing research reports against current 2026 real-world progress. You provide clear, rigorous, temporal diffs, pinpoint outdated information, highlight missing angles, and suggest authoritative sources.

GROUNDED REPORT CONTEXT:
Topic: "${topic}"
Version: Version ${version}.0
Original Publication Date: ${createdAtDate}

FULL REPORT TEXT:
${content.substring(0, 4000)}

FRESH WEB RESEARCH & 2026 DEVELOPMENTS:
${freshSourcesSummary}

INSTRUCTIONS:
1. Ground your answers strictly in the contrast between the Original Report and the Fresh Web Research.
2. Structure your response with clean Markdown:
   - ### ⏳ Temporal Shifts
     Explain what has changed in the industry or research domain since this report was generated.
   - ### ⚠️ Outdated Points & Superseded Claims
     Identify specific claims, metrics, or perspectives from the report that are no longer accurate or have been revised.
   - ### 💡 Crucial Missing Angles & New Developments
     Highlight breakthroughs, new papers, or market shifts that should be incorporated into the next version.
   - ### 🔗 Recommended Authoritative Sources
     Provide 2-3 clickable Markdown links using the fresh sources found above (e.g. "[Title](URL)").
3. Be direct, authoritative, and concise. Use bold callouts and bulleted lists.`;

    const groqMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add prior conversation turns if provided
    if (Array.isArray(history)) {
      for (const h of history.slice(-4)) {
        if (h.role === 'user' || h.role === 'assistant') {
          groqMessages.push({ role: h.role, content: String(h.content) });
        }
      }
    }

    groqMessages.push({ role: 'user', content: userQuery });

    // 4. Return Streaming SSE Response or Non-Streaming JSON
    if (stream) {
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            // Send initial sources event
            const sourcesPayload = JSON.stringify({
              type: 'sources',
              sources: sources.map((s) => ({
                title: s.title,
                url: s.url,
                snippet: s.content.substring(0, 160) + '...',
              })),
              topic,
              version,
            });
            controller.enqueue(encoder.encode(`data: ${sourcesPayload}\n\n`));

            // Stream tokens
            for await (const token of streamGroqTokens(groqMessages, { temperature: 0.3 })) {
              const tokenPayload = JSON.stringify({ type: 'token', content: token });
              controller.enqueue(encoder.encode(`data: ${tokenPayload}\n\n`));
            }

            // Send done signal
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
    const answer = await callGroq(groqMessages, { temperature: 0.3 });
    return NextResponse.json({
      success: true,
      answer,
      topic,
      version,
      sources,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error in chat compare API:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
