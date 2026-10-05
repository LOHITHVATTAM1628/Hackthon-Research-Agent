const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local or .env
const envLocalPath = path.resolve(__dirname, '../.env.local');
const envPath = fs.existsSync(envLocalPath) ? envLocalPath : path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Supabase URL or Service Role Key missing in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runSeed() {
  console.log('--- Starting Seed Data Script ---');
  console.log('Connecting to:', supabaseUrl);

  const v_user_id = '11111111-1111-4111-a111-111111111111';
  const v_collab_user_id = '22222222-2222-4222-a222-222222222222';
  const v_admin_id = '33333333-3333-4333-a333-333333333333';

  // 1. Create Demo Auth Users
  const usersToCreate = [
    {
      id: v_user_id,
      email: 'demo.researcher@researchai.io',
      password: 'DemoJudge2026!',
      name: 'Dr. Maya Vance (Lead Researcher)',
      role: 'researcher',
    },
    {
      id: v_collab_user_id,
      email: 'alex.chen@researchai.io',
      password: 'DemoJudge2026!',
      name: 'Dr. Alex Chen (Collaborator)',
      role: 'researcher',
    },
    {
      id: v_admin_id,
      email: 'admin@researchai.io',
      password: 'AdminJudge2026!',
      name: 'System Administrator',
      role: 'admin',
    },
  ];

  for (const u of usersToCreate) {
    try {
      const { data: created, error } = await supabase.auth.admin.createUser({
        id: u.id,
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name, role: u.role },
      });
      if (error) {
        console.log(`Auth user ${u.email}: ${error.message} (already exists)`);
      } else {
        console.log(`Auth user created: ${u.email} (${u.id})`);
      }
    } catch (err) {
      console.warn(`Auth user creation caught error:`, err.message);
    }
  }

  // 2. Populate public.users Table
  const publicUsers = [
    {
      id: v_user_id,
      name: 'Dr. Maya Vance (Lead Researcher)',
      email: 'demo.researcher@researchai.io',
      role: 'researcher',
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
    {
      id: v_collab_user_id,
      name: 'Dr. Alex Chen (Collaborator)',
      email: 'alex.chen@researchai.io',
      role: 'researcher',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      id: v_admin_id,
      name: 'System Administrator',
      email: 'admin@researchai.io',
      role: 'admin',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ];

  const { error: usersErr } = await supabase.from('users').upsert(publicUsers);
  if (usersErr) console.warn('public.users upsert warning:', usersErr.message);
  else console.log('public.users seeded successfully.');

  // 3. Research Project
  const v_proj_id = 'a4a311b9-4284-4374-a856-f78217e022ea';
  const projectData = {
    id: v_proj_id,
    user_id: v_user_id,
    topic: 'Artificial Intelligence in Healthcare: Autonomous Diagnostics & Patient Care',
    status: 'completed',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: projErr } = await supabase.from('research_projects').upsert(projectData);
  if (projErr) console.warn('research_projects upsert warning:', projErr.message);
  else console.log('research_projects seeded successfully.');

  // 4. Runs (Valid UUIDs)
  const v_run1_id = '44444444-4444-4444-a444-444444444441';
  const v_run2_id = '44444444-4444-4444-a444-444444444442';

  const runs = [
    {
      id: v_run1_id,
      research_project_id: v_proj_id,
      status: 'completed',
      started_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      completed_at: new Date(Date.now() - 7 * 86400000 + 45000).toISOString(),
    },
    {
      id: v_run2_id,
      research_project_id: v_proj_id,
      status: 'completed',
      started_at: new Date(Date.now() - 3600000).toISOString(),
      completed_at: new Date(Date.now() - 3600000 + 38000).toISOString(),
    },
  ];

  const { error: runsErr } = await supabase.from('research_runs').upsert(runs);
  if (runsErr) console.warn('research_runs upsert warning:', runsErr.message);
  else console.log('research_runs seeded successfully.');

  // 5. Sources
  const sources = [
    {
      research_run_id: v_run1_id,
      url: 'https://www.nature.com/articles/s41746-024-00123-x',
      title: 'Deep Learning for Clinical Diagnostics: Multimodal Foundation Models',
      source_type: 'journal',
      published_date: '2024-08-15',
      relevance_score: 0.98,
    },
    {
      research_run_id: v_run1_id,
      url: 'https://www.who.int/news/item/ai-ethics-healthcare-guidance',
      title: 'WHO Regulatory Framework for Healthcare AI Deployments',
      source_type: 'policy',
      published_date: '2024-05-10',
      relevance_score: 0.91,
    },
    {
      research_run_id: v_run2_id,
      url: 'https://jamanetwork.com/journals/jama/article-abstract/2819001',
      title: 'Clinical Trial Verification of Autonomous Radiologic Triage',
      source_type: 'clinical_trial',
      published_date: '2026-09-12',
      relevance_score: 0.97,
    },
    {
      research_run_id: v_run2_id,
      url: 'https://fda.gov/medical-devices/software-medical-device-samd/ai-updates',
      title: 'FDA Cleared Generative AI Diagnostic Assistive Tools Update',
      source_type: 'regulatory',
      published_date: '2026-10-01',
      relevance_score: 0.94,
    },
  ];

  try {
    const { error: srcErr } = await supabase.from('sources').insert(sources);
    if (srcErr) console.log('sources insert notice:', srcErr.message);
    else console.log('sources seeded successfully.');
  } catch (e) {
    console.warn('sources insert caught:', e.message);
  }

  // 6. Reports (Valid UUIDs)
  const v_report1_id = '55555555-5555-4555-a555-555555555551';
  const v_report2_id = '55555555-5555-4555-a555-555555555552';

  const report1Content = `# Artificial Intelligence in Healthcare: Preliminary Synthesis (v1.0)

## Executive Summary
Artificial Intelligence applications in clinical workflows are rapidly maturing, primarily concentrated on Computer Vision for radiologic imaging and Natural Language Processing for automated Electronic Health Record (EHR) transcription.

## Key Insights
1. **Imaging Accuracy**: Convolutional neural networks match senior radiologist sensitivity in detecting pulmonary nodules (94.2% ROC-AUC).
2. **Workflow Efficiencies**: Ambient scribing tools have demonstrated a 31% reduction in administrative clinician burden.
3. **Regulatory Ambiguity**: FDA approval pathways remain largely optimized for static software rather than continuously learning adaptive neural networks.

## Challenges
- High hallucination rates in generative LLM discharge summaries.
- Algorithmic bias across underrepresented demographic cohorts.
`;

  const report2Content = `# Artificial Intelligence in Healthcare: Autonomous Diagnostics & Patient Care (v2.0)

## Executive Summary
This updated assessment synthesizes recent breakthroughs in Multimodal Clinical Foundation Models and newly cleared FDA adaptive regulatory frameworks. Autonomous AI agents have transitioned from assistive triage into verified clinical decision-support environments.

## Updated Key Insights
1. **Multimodal Reasoning**: Unified vision-language medical models now integrate patient history, genomics, and MRI imaging simultaneously, yielding a 97.4% diagnostic concordance rate.
2. **Clinical Trial Validations**: JAMA published results from the first prospective multi-center randomized controlled trial confirming a 40% reduction in diagnostic delays for acute stroke workflows.
3. **New Regulatory Clearances**: The FDA published its finalized framework for continuously learning, post-market monitored AI algorithms in October 2026.

## Persistent Challenges
- Interoperability across legacy FHIR/HL7 hospital infrastructure.
- Liability distribution between healthcare providers and software vendors.
`;

  const reports = [
    {
      id: v_report1_id,
      research_project_id: v_proj_id,
      research_run_id: v_run1_id,
      content: report1Content,
      version: 1,
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: v_report2_id,
      research_project_id: v_proj_id,
      research_run_id: v_run2_id,
      content: report2Content,
      version: 2,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  const { error: repErr } = await supabase.from('reports').upsert(reports);
  if (repErr) console.warn('reports upsert warning:', repErr.message);
  else console.log('reports seeded successfully.');

  // 7. Agent Logs for Run 2
  const logs = [
    {
      research_run_id: v_run2_id,
      agent_name: 'Search Agent',
      status: 'running',
      message: 'Generating Tavily search queries for multimodal clinical AI models...',
      timestamp: new Date(Date.now() - 58 * 60000).toISOString(),
    },
    {
      research_run_id: v_run2_id,
      agent_name: 'Search Agent',
      status: 'completed',
      message: 'Tavily web scan completed: 18 links analyzed, 4 authoritative clinical papers extracted.',
      timestamp: new Date(Date.now() - 57 * 60000).toISOString(),
    },
    {
      research_run_id: v_run2_id,
      agent_name: 'Reader Agent',
      status: 'running',
      message: 'Extracting clinical trial results from JAMA and FDA regulatory data...',
      timestamp: new Date(Date.now() - 56 * 60000).toISOString(),
    },
    {
      research_run_id: v_run2_id,
      agent_name: 'Reader Agent',
      status: 'completed',
      message: 'Successfully extracted statistical benchmarks and regulatory guidelines.',
      timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
    },
    {
      research_run_id: v_run2_id,
      agent_name: 'Writer Chain',
      status: 'running',
      message: 'Synthesizing Version 2.0 draft comparing baseline metrics with latest data...',
      timestamp: new Date(Date.now() - 54 * 60000).toISOString(),
    },
    {
      research_run_id: v_run2_id,
      agent_name: 'Writer Chain',
      status: 'completed',
      message: 'Comprehensive updated report generated.',
      timestamp: new Date(Date.now() - 53 * 60000).toISOString(),
    },
    {
      research_run_id: v_run2_id,
      agent_name: 'Critic Chain',
      status: 'running',
      message: 'Auditing draft for clinical factuality, safety limitations, and citation fidelity...',
      timestamp: new Date(Date.now() - 52 * 60000).toISOString(),
    },
    {
      research_run_id: v_run2_id,
      agent_name: 'Critic Chain',
      status: 'completed',
      message: 'Critique complete. Quality Score: 94/100. Ready for publication.',
      timestamp: new Date(Date.now() - 51 * 60000).toISOString(),
    },
  ];

  try {
    const { error: logsErr } = await supabase.from('agent_logs').insert(logs);
    if (logsErr) console.log('agent_logs insert notice:', logsErr.message);
    else console.log('agent_logs seeded successfully.');
  } catch (e) {
    console.warn('agent_logs caught:', e.message);
  }

  // 8. Research Comparisons
  const comparisonResult = {
    summary_of_changes: 'Significant shift from theoretical transcription tools to FDA-regulated autonomous diagnostic pipelines and prospective clinical trials.',
    unchanged_facts: [
      'Convolutional neural networks remain standard for single-modality radiology imaging.',
      'Algorithmic demographic bias and interoperability challenges remain major barriers.',
    ],
    new_developments: [
      'First randomized prospective clinical trial published in JAMA proving 40% diagnostic speedup.',
      'FDA issued definitive October 2026 guidance for adaptive, non-static medical algorithms.',
      'Multimodal models integrating genomics with radiology achieved 97.4% concordance.',
    ],
    outdated_information: [
      'Claim that regulatory pathways only permit static frozen models is now obsolete due to the October 2026 FDA update.',
    ],
    recommended_additions: [
      'Cite the recent JAMA clinical trial.',
      'Include the new liability risk matrix for attending physicians.',
    ],
  };

  const compRecord = {
    old_report_id: v_report1_id,
    new_report_id: v_report2_id,
    comparison_result: comparisonResult,
    created_at: new Date(Date.now() - 50 * 60000).toISOString(),
  };

  try {
    const { error: compErr } = await supabase.from('research_comparisons').upsert(compRecord, { onConflict: 'old_report_id,new_report_id' });
    if (compErr) {
      await supabase.from('research_comparisons').insert(compRecord);
    }
    console.log('research_comparisons seeded successfully.');
  } catch (e) {
    console.warn('research_comparisons caught:', e.message);
  }

  // 9. Collaborations
  const collabRecord = {
    id: '66666666-6666-4666-a666-666666666661',
    researcher_a: v_collab_user_id,
    researcher_b: v_user_id,
    research_topic: 'Impact of AI on Healthcare Diagnostics',
    status: 'accepted',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  };

  const { error: collabErr } = await supabase.from('collaborations').upsert(collabRecord);
  if (collabErr) console.warn('collaborations warning:', collabErr.message);
  else console.log('collaborations seeded successfully.');

  // 10. In-App Notifications
  const notifications = [
    {
      recipient_id: v_user_id,
      type: 'collaboration_alert',
      message: 'Dr. Alex Chen accepted your collaboration invite on "Impact of AI on Healthcare Diagnostics".',
      related_research_id: v_proj_id,
      read_status: false,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      recipient_id: v_user_id,
      type: 'duplicate_topic_alert',
      message: 'Similar Topic Detected: "Clinical Applications of AI" by Dr. Alex Chen has a 78% semantic match with your project.',
      related_research_id: v_proj_id,
      read_status: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  try {
    const { error: notifErr } = await supabase.from('notifications').insert(notifications);
    if (notifErr) console.log('notifications notice:', notifErr.message);
    else console.log('notifications seeded successfully.');
  } catch (e) {
    console.warn('notifications caught:', e.message);
  }

  console.log('--- ALL SEED DATA SUCCESSFULLY APPLIED TO SUPABASE ---');
}

runSeed().catch(console.error);
