import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { computeReportDiff } from '@/lib/diff/engine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    let projectId = id;

    // Check if id is a run ID
    const { data: runData } = await supabaseAdmin
      .from('research_runs')
      .select('research_project_id')
      .eq('id', id)
      .maybeSingle();

    if (runData?.research_project_id) {
      projectId = runData.research_project_id;
    }

    // Fetch all versions of reports for this project
    const { data: reports, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('research_project_id', projectId)
      .order('version', { ascending: true });

    if (error) {
      throw error;
    }

    const { searchParams } = new URL(req.url);
    const vOld = parseInt(searchParams.get('vOld') || '', 10);
    const vNew = parseInt(searchParams.get('vNew') || '', 10);

    let diff = null;
    if (vOld && vNew && reports) {
      const repOld = reports.find((r) => r.version === vOld);
      const repNew = reports.find((r) => r.version === vNew);

      if (repOld && repNew) {
        diff = computeReportDiff(repOld.content, repNew.content);
      }
    }

    return NextResponse.json({
      projectId,
      totalVersions: reports?.length || 0,
      reports: reports || [],
      versions: reports || [],
      diff,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error fetching report versions:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
