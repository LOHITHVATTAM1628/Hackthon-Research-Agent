import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { runEvolutionPipeline } from '@/lib/agents/evolution';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json().catch(() => ({}));
    const { focusPrompt, sync = false } = body;

    // Check if id is a project_id or run_id
    let projectId = id;
    const { data: runData } = await supabaseAdmin
      .from('research_runs')
      .select('research_project_id')
      .eq('id', id)
      .maybeSingle();

    if (runData?.research_project_id) {
      projectId = runData.research_project_id;
    }

    if (sync) {
      const result = await runEvolutionPipeline({
        projectId,
        focusPrompt,
      });
      return NextResponse.json(result);
    }

    // Launch background evolution
    const { data: latestReport } = await supabaseAdmin
      .from('reports')
      .select('version')
      .eq('research_project_id', projectId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const expectedVersion = (latestReport?.version || 1) + 1;

    (async () => {
      try {
        await runEvolutionPipeline({
          projectId,
          focusPrompt,
        });
      } catch (err) {
        console.error('Background evolution failed:', err);
      }
    })();

    return NextResponse.json({
      success: true,
      projectId,
      message: `Autonomous Evolution to Version ${expectedVersion}.0 started.`,
      targetVersion: expectedVersion,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error starting evolution:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
