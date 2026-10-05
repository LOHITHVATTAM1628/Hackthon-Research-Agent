export interface EnrichedCollabData {
  id: string;
  researcher_a: string;
  researcher_b: string;
  research_topic: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  researcher_a_user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  researcher_b_user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  project: {
    id: string;
    topic: string;
    status: string;
    created_at: string;
  } | null;
  isOwner: boolean;
}

export let inMemoryCollaborations: EnrichedCollabData[] = [
  {
    id: 'collab-demo-1',
    researcher_a: '135a077d-43f4-4e02-a0b9-39d6480eb9f3',
    researcher_b: 'user-elena-vance',
    research_topic: 'Impact of AI on Healthcare Diagnostics',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    researcher_a_user: {
      id: '135a077d-43f4-4e02-a0b9-39d6480eb9f3',
      name: 'Dr. Lohith (You)',
      email: 'lead.researcher@livingresearch.ai',
      role: 'Principal Investigator',
    },
    researcher_b_user: {
      id: 'user-elena-vance',
      name: 'Dr. Elena Vance',
      email: 'e.vance@mit-labs.edu',
      role: 'Clinical AI Fellow',
    },
    project: {
      id: 'a4a311b9-4284-4374-a856-f78217e022ea',
      topic: 'Impact of AI on Healthcare Diagnostics',
      status: 'completed',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    isOwner: true,
  },
  {
    id: 'collab-demo-2',
    researcher_a: 'user-marcus-chen',
    researcher_b: '135a077d-43f4-4e02-a0b9-39d6480eb9f3',
    research_topic: 'Multi-Agent System Architectures & Consensus in 2026',
    status: 'accepted',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    researcher_a_user: {
      id: 'user-marcus-chen',
      name: 'Marcus Chen',
      email: 'm.chen@stanford-ai.org',
      role: 'Lead Systems Architect',
    },
    researcher_b_user: {
      id: '135a077d-43f4-4e02-a0b9-39d6480eb9f3',
      name: 'Dr. Lohith (You)',
      email: 'lead.researcher@livingresearch.ai',
      role: 'Principal Investigator',
    },
    project: {
      id: 'a4a311b9-4284-4374-a856-f78217e022ea',
      topic: 'Multi-Agent System Architectures & Consensus in 2026',
      status: 'completed',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
    isOwner: false,
  },
];
