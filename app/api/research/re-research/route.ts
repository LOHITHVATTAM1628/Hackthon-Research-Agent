import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { runEvolutionPipeline } from '@/lib/agents/evolution';
import {
  generateSemanticComparison,
  persistComparisonRecord,
  fetchProjectEvolutionData,
} from '@/lib/services/report-comparison';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const isPlaceholderUrl = (url?: string) =>
  !url || url.includes('your-project-id') || url.includes('placeholder');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId query parameter is required' }, { status: 400 });
    }

    const data = await fetchProjectEvolutionData(projectId);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error fetching evolution data:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { projectId, focusPrompt } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // 1. Fetch project and latest report before evolution
    let projectTopic = 'Autonomous Multi-Agent Research';
    let oldReportId = `rep-${projectId}-v1`;
    let oldReportContent = '';
    let currentVersion = 1;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isPlaceholderUrl(supabaseUrl)) {
      try {
        const { data: project } = await supabaseAdmin
          .from('research_projects')
          .select('*')
          .eq('id', projectId)
          .maybeSingle();

        if (project) {
          projectTopic = project.topic;
        }

        const { data: latestReport } = await supabaseAdmin
          .from('reports')
          .select('*')
          .eq('research_project_id', projectId)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestReport) {
          oldReportId = latestReport.id;
          oldReportContent = latestReport.content;
          currentVersion = latestReport.version;
        }

        // Set status to updating
        await supabaseAdmin
          .from('research_projects')
          .update({ status: 'updating' })
          .eq('id', projectId);
      } catch (sbErr) {
        console.warn('[re-research] Supabase project check fallback:', sbErr);
      }
    }

    if (!oldReportContent) {
      oldReportContent = `# ${projectTopic}: Version 1.0 Baseline Findings\n\n## Executive Summary\nInitial benchmark analysis and baseline empirical evaluation.\n\n## Findings\n- Standard initial architectures.\n- Evaluated tool calling and basic reasoning pipelines.\n\n## Limitations\nEarly prototype limits.`;
    }

    // 2. Execute Evolution Pipeline (Search -> Reader -> Writer -> Critic)
    const evoResult = await runEvolutionPipeline({
      projectId,
      focusPrompt: focusPrompt || 'Latest breakthroughs, newer empirical data, and current trends',
    });

    const newVersion = evoResult.newVersion || currentVersion + 1;
    const newReportContent = evoResult.newReportContent || oldReportContent;
    const newReportId = `rep-${projectId}-v${newVersion}`;

    // 3. Automated Comparative Intelligence Chain (Groq LLM)
    console.log(`[Re-Research Diff] Comparing v${currentVersion} with v${newVersion} for "${projectTopic}"...`);
    const diffResult = await generateSemanticComparison(
      oldReportContent,
      newReportContent,
      projectTopic
    );

    // 4. Persist Comparison Record
    const savedComparison = await persistComparisonRecord(
      projectId,
      oldReportId,
      newReportId,
      diffResult
    );

    return NextResponse.json({
      success: true,
      projectId,
      runId: evoResult.runId,
      targetVersion: newVersion,
      oldReportId,
      newReportId,
      comparison: diffResult,
      comparisonRecord: savedComparison,
      message: `Successfully re-researched and evolved to Version ${newVersion}.0!`,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error in re-research API:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
