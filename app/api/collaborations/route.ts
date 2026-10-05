import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const isPlaceholderUrl = (url?: string) =>
  !url || url.includes('your-project-id') || url.includes('placeholder');

import {
  EnrichedCollabData,
  inMemoryCollaborations,
} from '@/lib/services/collaboration-store';


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || '135a077d-43f4-4e02-a0b9-39d6480eb9f3';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isPlaceholderUrl(supabaseUrl)) {
      try {
        const { data: records, error } = await supabaseAdmin
          .from('collaborations')
          .select('*')
          .or(`researcher_a.eq.${userId},researcher_b.eq.${userId}`)
          .order('created_at', { ascending: false });

        if (!error && records && records.length > 0) {
          const userIds = new Set<string>();
          records.forEach((c) => {
            if (c.researcher_a) userIds.add(c.researcher_a);
            if (c.researcher_b) userIds.add(c.researcher_b);
          });

          const { data: users } = await supabaseAdmin
            .from('users')
            .select('id, name, email, role')
            .in('id', Array.from(userIds));

          const topics = Array.from(new Set(records.map((c) => c.research_topic)));
          const { data: projects } = await supabaseAdmin
            .from('research_projects')
            .select('id, topic, status, created_at')
            .in('topic', topics);

          const enriched = records.map((collab) => {
            const userA = users?.find((u) => u.id === collab.researcher_a) || {
              id: collab.researcher_a,
              name: 'Lead Researcher',
              email: 'researcher@livingresearch.ai',
              role: 'researcher',
            };
            const userB = users?.find((u) => u.id === collab.researcher_b) || {
              id: collab.researcher_b,
              name: 'Peer Investigator',
              email: 'peer@livingresearch.ai',
              role: 'researcher',
            };
            const matchedProj = projects?.find((p) => p.topic === collab.research_topic);

            return {
              ...collab,
              researcher_a_user: userA,
              researcher_b_user: userB,
              project: matchedProj || null,
              isOwner: collab.researcher_a === userId,
            };
          });

          return NextResponse.json({ collaborations: enriched });
        }
      } catch (sbErr) {
        console.warn('Supabase collaborations query fallback:', sbErr);
      }
    }

    // Fallback to in-memory store
    const userCollabs = inMemoryCollaborations.map((c) => ({
      ...c,
      isOwner: c.researcher_a === userId,
    }));

    return NextResponse.json({ collaborations: userCollabs });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error in GET collaborations:', err);
    return NextResponse.json({ collaborations: inMemoryCollaborations });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { collaborationId, action, responderName } = body;

    if (!collaborationId || !action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'collaborationId and valid action ("accept" or "decline") are required' },
        { status: 400 }
      );
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isPlaceholderUrl(supabaseUrl)) {
      try {
        const { data: updated, error: uErr } = await supabaseAdmin
          .from('collaborations')
          .update({ status: newStatus })
          .eq('id', collaborationId)
          .select()
          .single();

        if (!uErr && updated) {
          if (updated?.researcher_b) {
            const responder = responderName || 'Your research colleague';
            const notifMessage =
              action === 'accept'
                ? `${responder} accepted your collaboration request on topic: "${updated.research_topic}". You can now access shared project telemetry and reports.`
                : `${responder} was unable to accept your collaboration request on topic: "${updated.research_topic}".`;

            await supabaseAdmin.from('notifications').insert({
              recipient_id: updated.researcher_b,
              type: action === 'accept' ? 'collaboration_accepted' : 'collaboration_declined',
              message: notifMessage,
              read_status: false,
              created_at: new Date().toISOString(),
            });
          }

          return NextResponse.json({
            success: true,
            collaboration: updated,
            message: `Collaboration request successfully ${newStatus}.`,
          });
        }
      } catch (sbErr) {
        console.warn('Supabase collaborations update fallback:', sbErr);
      }
    }

    // In-memory update
    const target = inMemoryCollaborations.find((c) => c.id === collaborationId);
    if (target) {
      target.status = newStatus;
    }

    return NextResponse.json({
      success: true,
      collaboration: target || { id: collaborationId, status: newStatus },
      message: `Collaboration request successfully ${newStatus}.`,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error updating collaboration status:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
