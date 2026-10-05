import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const runOrProjectId = params.id;

    if (!runOrProjectId) {
      return NextResponse.json({ error: 'Missing research identifier' }, { status: 400 });
    }

    // Try finding by run ID first
    let run = null;
    let project = null;

    const { data: runData } = await supabaseAdmin
      .from('research_runs')
      .select('*')
      .eq('id', runOrProjectId)
      .maybeSingle();

    if (runData) {
      run = runData;
      const { data: projData } = await supabaseAdmin
        .from('research_projects')
        .select('*')
        .eq('id', runData.research_project_id)
        .maybeSingle();
      project = projData;
    } else {
      // Try finding by project ID
      const { data: projData } = await supabaseAdmin
        .from('research_projects')
        .select('*')
        .eq('id', runOrProjectId)
        .maybeSingle();

      if (projData) {
        project = projData;
        const { data: latestRun } = await supabaseAdmin
          .from('research_runs')
          .select('*')
          .eq('research_project_id', projData.id)
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        run = latestRun;
      }
    }

    if (!project && !run) {
      return NextResponse.json({ error: 'Research project or run not found' }, { status: 404 });
    }

    const runId = run?.id;

    // Fetch logs, sources, and reports for this run
    let logs: unknown[] = [];
    let sources: unknown[] = [];
    let report: unknown = null;

    if (runId) {
      const [logsRes, sourcesRes, reportRes] = await Promise.all([
        supabaseAdmin
          .from('agent_logs')
          .select('*')
          .eq('research_run_id', runId)
          .order('timestamp', { ascending: true }),
        supabaseAdmin
          .from('sources')
          .select('*')
          .eq('research_run_id', runId)
          .order('created_at', { ascending: true }),
        supabaseAdmin
          .from('reports')
          .select('*')
          .eq('research_run_id', runId)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      logs = logsRes.data || [];
      sources = sourcesRes.data || [];
      report = reportRes.data || null;
    }

    return NextResponse.json({
      project,
      run,
      logs,
      sources,
      report,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error fetching research status:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
