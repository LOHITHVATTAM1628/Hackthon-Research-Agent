import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Fetch recent projects from public.research_projects
    const { data: projData, error: projErr } = await supabaseAdmin
      .from('research_projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(40);

    if (projErr) {
      return NextResponse.json({ error: projErr.message }, { status: 500 });
    }

    if (!projData || projData.length === 0) {
      return NextResponse.json({
        projects: [],
        stats: { totalProjects: 0, completedRuns: 0, activeRuns: 0 },
      });
    }

    // Fetch latest runs for these projects
    const projectIds = projData.map((p) => p.id);
    const { data: runsData } = await supabaseAdmin
      .from('research_runs')
      .select('id, research_project_id, status, started_at')
      .in('research_project_id', projectIds)
      .order('started_at', { ascending: false });

    let completedCount = 0;
    let activeCount = 0;

    const allProjects = projData.map((proj) => {
      const matchingRun = runsData?.find((r) => r.research_project_id === proj.id);
      const runStatus = matchingRun?.status || proj.status;
      if (runStatus === 'completed') completedCount++;
      if (runStatus === 'running') activeCount++;

      return {
        id: proj.id,
        topic: proj.topic,
        status: proj.status,
        created_at: proj.created_at,
        user_id: proj.user_id,
        latest_run_id: matchingRun?.id,
        latest_run_status: runStatus,
      };
    });

    return NextResponse.json({
      projects: allProjects,
      stats: {
        totalProjects: allProjects.length,
        completedRuns: completedCount,
        activeRuns: activeCount,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
