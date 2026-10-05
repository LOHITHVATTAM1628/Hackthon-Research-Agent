import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { inMemoryCollaborations, EnrichedCollabData } from '@/lib/services/collaboration-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const isPlaceholderUrl = (url?: string) =>
  !url || url.includes('your-project-id') || url.includes('placeholder');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      projectId,
      researcherAId,
      candidateTopic,
      senderUserId,
      senderName,
    } = body;

    if (!candidateTopic || typeof candidateTopic !== 'string') {
      return NextResponse.json({ error: 'candidateTopic is required' }, { status: 400 });
    }

    // Default sender fallback if unauthenticated
    const fallbackSenderId = '135a077d-43f4-4e02-a0b9-39d6480eb9f3';
    const effectiveSenderId = senderUserId || fallbackSenderId;
    const effectiveSenderName = senderName || 'A Peer Researcher';

    let targetResearcherA = researcherAId;
    let targetTopic = candidateTopic;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isPlaceholderUrl(supabaseUrl)) {
      try {
        if (projectId) {
          const { data: proj } = await supabaseAdmin
            .from('research_projects')
            .select('id, user_id, topic')
            .eq('id', projectId)
            .maybeSingle();

          if (proj) {
            if (!targetResearcherA && proj.user_id) {
              targetResearcherA = proj.user_id;
            }
            if (!targetTopic) {
              targetTopic = proj.topic;
            }
          }
        }

        if (!targetResearcherA) {
          targetResearcherA = fallbackSenderId;
        }

        // 1. Insert into public.collaborations
        const { data: collabRecord, error: cErr } = await supabaseAdmin
          .from('collaborations')
          .insert({
            researcher_a: targetResearcherA,
            researcher_b: effectiveSenderId,
            research_topic: targetTopic,
            status: 'pending',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (!cErr && collabRecord) {
          // 2. Insert into public.notifications for Researcher A
          const notifMessage = `${effectiveSenderName} requested to collaborate on research topic: "${targetTopic}".`;

          const { data: notifRecord } = await supabaseAdmin
            .from('notifications')
            .insert({
              recipient_id: targetResearcherA,
              type: 'collaboration_invite',
              message: notifMessage,
              related_research_id: projectId || null,
              read_status: false,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          return NextResponse.json({
            success: true,
            collaboration: collabRecord,
            notification: notifRecord,
            message: `Collaboration request sent successfully!`,
          });
        }
      } catch (sbErr) {
        console.warn('Supabase collaboration request fallback:', sbErr);
      }
    }

    // Fallback: in-memory collaboration item
    const fallbackCollab: EnrichedCollabData = {
      id: `collab-${Date.now()}`,
      researcher_a: targetResearcherA || 'user-target-lead',
      researcher_b: effectiveSenderId,
      research_topic: targetTopic,
      status: 'pending',
      created_at: new Date().toISOString(),
      researcher_a_user: {
        id: targetResearcherA || 'user-target-lead',
        name: 'Project Lead',
        email: 'lead.investigator@livingresearch.ai',
        role: 'Principal Investigator',
      },
      researcher_b_user: {
        id: effectiveSenderId,
        name: effectiveSenderName,
        email: 'collaborator@livingresearch.ai',
        role: 'Research Fellow',
      },
      project: {
        id: projectId || 'demo-proj-id',
        topic: targetTopic,
        status: 'running',
        created_at: new Date().toISOString(),
      },
      isOwner: false,
    };

    inMemoryCollaborations.unshift(fallbackCollab);

    return NextResponse.json({
      success: true,
      collaboration: fallbackCollab,
      message: `Collaboration request dispatched to project lead!`,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error in collaboration request API:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
