import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function checkDuplicateTopic(topic: string | null) {
  if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
    return { isDuplicate: false, matches: [] };
  }

  const cleanTopic = topic.trim().toLowerCase();

  // Query research_projects
  const { data: allProjects, error } = await supabaseAdmin
    .from('research_projects')
    .select('id, topic, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !allProjects || allProjects.length === 0) {
    return { isDuplicate: false, matches: [] };
  }
  interface ProjectRow {
    id: string;
    topic: string;
    status: string;
    created_at: string;
  }

  const typedProjects: ProjectRow[] = (allProjects || []) as ProjectRow[];

  const topicWords: string[] = cleanTopic
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w: string) => w.length > 2);

  const matches: ProjectRow[] = [];

  for (const proj of typedProjects) {
    const projClean = (proj.topic || '').toLowerCase();
    // 1. Exact or substring match
    if (projClean === cleanTopic || projClean.includes(cleanTopic) || cleanTopic.includes(projClean)) {
      matches.push(proj);
      continue;
    }

    // 2. High word overlap
    const projWords: string[] = projClean
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 2);

    let shared = 0;
    for (const w of topicWords) {
      if (projWords.includes(w)) shared++;
    }

    const similarity = shared / Math.max(topicWords.length, projWords.length);
    if (similarity >= 0.5) {
      matches.push(proj);
    }
  }

  if (matches.length === 0) {
    return { isDuplicate: false, matches: [] };
  }

  // Enhance matches with latest run ID
  const projectIds = matches.map((m) => m.id);
  const { data: runs } = await supabaseAdmin
    .from('research_runs')
    .select('id, research_project_id, status, started_at')
    .in('research_project_id', projectIds)
    .order('started_at', { ascending: false });

  const enrichedMatches = matches.map((m) => {
    const latestRun = runs?.find((r) => r.research_project_id === m.id);
    return {
      id: m.id,
      topic: m.topic,
      status: m.status,
      created_at: m.created_at,
      latestRunId: latestRun?.id || m.id,
      runStatus: latestRun?.status || m.status,
    };
  });

  return {
    isDuplicate: true,
    matches: enrichedMatches,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic');
    const result = await checkDuplicateTopic(topic);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Check topic GET error:', error);
    return NextResponse.json({ isDuplicate: false, matches: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json().catch(() => ({}));
    const result = await checkDuplicateTopic(topic);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Check topic POST error:', error);
    return NextResponse.json({ isDuplicate: false, matches: [] });
  }
}
