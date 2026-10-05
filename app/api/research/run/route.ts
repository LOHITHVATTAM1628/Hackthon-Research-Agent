import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';
import { runResearchPipeline } from '@/lib/agents/orchestrator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { topic, projectId: existingProjectId, sync = false, userId: passedUserId } = body;

    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      return NextResponse.json(
        { error: 'A valid research topic of at least 3 characters is required.' },
        { status: 400 }
      );
    }

    const cleanTopic = topic.trim();

    // Determine current user from body, session, or existing records
    let userId: string | null = passedUserId || null;
    try {
      const supabase = createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Unauthenticated or anonymous run allowed
    }

    // Verify or ensure user exists in public.users to satisfy foreign key constraint
    if (userId) {
      const { data: userRecord } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!userRecord) {
        // Sync user into public.users from auth
        try {
          const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(userId);
          const email = authUserData?.user?.email || `user_${userId.slice(0, 8)}@researchmind.local`;
          const name = authUserData?.user?.user_metadata?.name || email.split('@')[0];
          const role = authUserData?.user?.user_metadata?.role || 'researcher';

          await supabaseAdmin.from('users').upsert({
            id: userId,
            email,
            name,
            role,
          }, { onConflict: 'id' });
        } catch {
          try {
            await supabaseAdmin.from('users').upsert({
              id: userId,
              email: `user_${userId.slice(0, 8)}@researchmind.local`,
              name: 'Active Researcher',
              role: 'researcher',
            }, { onConflict: 'id' });
          } catch {
            // Ignore fallback error
          }
        }
      }
    } else {
      // Fallback to first available researcher in public.users
      const { data: fallbackUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (fallbackUser) {
        userId = fallbackUser.id;
      } else {
        const demoId = '11111111-1111-4111-a111-111111111111';
        try {
          await supabaseAdmin.from('users').upsert({
            id: demoId,
            email: 'demo.researcher@researchai.io',
            name: 'Dr. Maya Vance',
            role: 'researcher',
          }, { onConflict: 'id' });
        } catch {
          // Ignore fallback error
        }
        userId = demoId;
      }
    }

    // 1. Get or create research project
    let projectId = existingProjectId;
    if (!projectId) {
      const { data: project, error: pErr } = await supabaseAdmin
        .from('research_projects')
        .insert({
          user_id: userId,
          topic: cleanTopic,
          status: 'researching',
        })
        .select()
        .single();

      if (pErr || !project) {
        console.error('Failed to create research project:', pErr);
        return NextResponse.json(
          { error: `Database error creating project: ${pErr?.message}` },
          { status: 500 }
        );
      }
      projectId = project.id;
    } else {
      await supabaseAdmin
        .from('research_projects')
        .update({
          status: 'researching',
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);
    }

    // 2. Create research run
    const { data: run, error: rErr } = await supabaseAdmin
      .from('research_runs')
      .insert({
        research_project_id: projectId,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (rErr || !run) {
      console.error('Failed to create research run:', rErr);
      return NextResponse.json(
        { error: `Database error creating run: ${rErr?.message}` },
        { status: 500 }
      );
    }

    const runId = run.id;

    // 3. If sync mode requested (e.g. testing or CLI), await pipeline
    if (sync) {
      const result = await runResearchPipeline({
        projectId,
        runId,
        topic: cleanTopic,
        userId,
      });
      return NextResponse.json(result);
    }

    // 4. Default async mode: fire pipeline in background and return runId immediately
    // Using void promise to execute independently
    (async () => {
      try {
        await runResearchPipeline({
          projectId,
          runId,
          topic: cleanTopic,
          userId,
        });
      } catch (err) {
        console.error(`Background pipeline execution failed for run ${runId}:`, err);
      }
    })();

    return NextResponse.json({
      success: true,
      projectId,
      runId,
      topic: cleanTopic,
      message: 'Autonomous research pipeline started successfully.',
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error starting research pipeline:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
