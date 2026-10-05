-- Ensure pgcrypto is enabled for password hashing
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

do $$
declare
  v_user_id uuid := '11111111-1111-4111-a111-111111111111'::uuid;
  v_collab_user_id uuid := '22222222-2222-4222-a222-222222222222'::uuid;
  v_admin_id uuid := '33333333-3333-4333-a333-333333333333'::uuid;
  
  v_proj_id uuid := uuid_generate_v4();
  v_run1_id uuid := uuid_generate_v4();
  v_run2_id uuid := uuid_generate_v4();
  v_report1_id uuid := uuid_generate_v4();
  v_report2_id uuid := uuid_generate_v4();
begin

  -- 1. Create Demo Auth Users in auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values 
  (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'demo.researcher@researchai.io',
    crypt('DemoJudge2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Dr. Maya Vance (Demo)"}',
    now(),
    now()
  ),
  (
    v_collab_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'alex.chen@researchai.io',
    crypt('DemoJudge2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Dr. Alex Chen"}',
    now(),
    now()
  ),
  (
    v_admin_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@researchai.io',
    crypt('AdminJudge2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"System Admin"}',
    now(),
    now()
  )
  on conflict (id) do nothing;

  -- 2. Populate public.users Table
  insert into public.users (id, name, email, role, created_at) values
    (v_user_id, 'Dr. Maya Vance (Lead Researcher)', 'demo.researcher@researchai.io', 'researcher', now() - interval '14 days'),
    (v_collab_user_id, 'Dr. Alex Chen (Collaborator)', 'alex.chen@researchai.io', 'researcher', now() - interval '10 days'),
    (v_admin_id, 'System Administrator', 'admin@researchai.io', 'admin', now() - interval '30 days')
  on conflict (id) do nothing;

  -- 3. Research Project (Topic: AI in Healthcare)
  insert into public.research_projects (id, user_id, topic, status, created_at, updated_at) values
    (v_proj_id, v_user_id, 'Artificial Intelligence in Healthcare: Autonomous Diagnostics & Patient Care', 'completed', now() - interval '7 days', now());

  -- 4. Initial Run (Version 1 - 7 Days Ago)
  insert into public.research_runs (id, research_project_id, status, started_at, completed_at) values
    (v_run1_id, v_proj_id, 'completed', now() - interval '7 days', (now() - interval '7 days') + interval '45 seconds');

  -- 5. Evolution Run (Version 2 - Re-Research Executed Today)
  insert into public.research_runs (id, research_project_id, status, started_at, completed_at) values
    (v_run2_id, v_proj_id, 'completed', now() - interval '1 hour', (now() - interval '1 hour') + interval '38 seconds');

  -- 6. Sources for Run 1 & Run 2
  insert into public.sources (research_run_id, url, title, source_type, published_date, relevance_score) values
    (v_run1_id, 'https://www.nature.com/articles/s41746-024-00123-x', 'Deep Learning for Clinical Diagnostics: Multimodal Foundation Models', 'journal', '2024-08-15', 0.98),
    (v_run1_id, 'https://www.who.int/news/item/ai-ethics-healthcare-guidance', 'WHO Regulatory Framework for Healthcare AI Deployments', 'policy', '2024-05-10', 0.91),
    (v_run2_id, 'https://jamanetwork.com/journals/jama/article-abstract/2819001', 'Clinical Trial Verification of Autonomous Radiologic Triage', 'clinical_trial', '2026-09-12', 0.97),
    (v_run2_id, 'https://fda.gov/medical-devices/software-medical-device-samd/ai-updates', 'FDA Cleared Generative AI Diagnostic Assistive Tools Update', 'regulatory', '2026-10-01', 0.94);

  -- 7. Reports (Version 1 & Version 2)
  insert into public.reports (id, research_project_id, research_run_id, content, version, created_at) values
    (v_report1_id, v_proj_id, v_run1_id, 
'# Artificial Intelligence in Healthcare: Preliminary Synthesis (v1.0)

## Executive Summary
Artificial Intelligence applications in clinical workflows are rapidly maturing, primarily concentrated on Computer Vision for radiologic imaging and Natural Language Processing for automated Electronic Health Record (EHR) transcription.

## Key Insights
1. **Imaging Accuracy**: Convolutional neural networks match senior radiologist sensitivity in detecting pulmonary nodules (94.2% ROC-AUC).
2. **Workflow Efficiencies**: Ambient scribing tools have demonstrated a 31% reduction in administrative clinician burden.
3. **Regulatory Ambiguity**: FDA approval pathways remain largely optimized for static software rather than continuously learning adaptive neural networks.

## Challenges
- High hallucination rates in generative LLM discharge summaries.
- Algorithmic bias across underrepresented demographic cohorts.
', 1, now() - interval '7 days'),

    (v_report2_id, v_proj_id, v_run2_id, 
'# Artificial Intelligence in Healthcare: Autonomous Diagnostics & Patient Care (v2.0)

## Executive Summary
This updated assessment synthesizes recent breakthroughs in Multimodal Clinical Foundation Models and newly cleared FDA adaptive regulatory frameworks. Autonomous AI agents have transitioned from assistive triage into verified clinical decision-support environments.

## Updated Key Insights
1. **Multimodal Reasoning**: Unified vision-language medical models now integrate patient history, genomics, and MRI imaging simultaneously, yielding a 97.4% diagnostic concordance rate.
2. **Clinical Trial Validations**: JAMA published results from the first prospective multi-center randomized controlled trial confirming a 40% reduction in diagnostic delays for acute stroke workflows.
3. **New Regulatory Clearances**: The FDA published its finalized framework for continuously learning, post-market monitored AI algorithms in October 2026.

## Persistent Challenges
- Interoperability across legacy FHIR/HL7 hospital infrastructure.
- Liability distribution between healthcare providers and software vendors.
', 2, now() - interval '1 hour');

  -- 8. Real-Time Agent Telemetry Logs for Run 2
  insert into public.agent_logs (research_run_id, agent_name, status, message, timestamp) values
    (v_run2_id, 'Search Agent', 'running', 'Generating Tavily search queries for multimodal clinical AI models...', now() - interval '58 minutes'),
    (v_run2_id, 'Search Agent', 'completed', 'Tavily web scan completed: 18 links analyzed, 4 authoritative clinical papers extracted.', now() - interval '57 minutes'),
    (v_run2_id, 'Reader Agent', 'running', 'Extracting clinical trial results from JAMA and FDA regulatory data...', now() - interval '56 minutes'),
    (v_run2_id, 'Reader Agent', 'completed', 'Successfully extracted statistical benchmarks and regulatory guidelines.', now() - interval '55 minutes'),
    (v_run2_id, 'Writer Chain', 'running', 'Synthesizing Version 2.0 draft comparing baseline metrics with latest data...', now() - interval '54 minutes'),
    (v_run2_id, 'Writer Chain', 'completed', 'Comprehensive updated report generated.', now() - interval '53 minutes'),
    (v_run2_id, 'Critic Chain', 'running', 'Auditing draft for clinical factuality, safety limitations, and citation fidelity...', now() - interval '52 minutes'),
    (v_run2_id, 'Critic Chain', 'completed', 'Critique complete. Quality Score: 94/100. Ready for publication.', now() - interval '51 minutes');

  -- 9. Evolution Diff Comparison (Old Report v1 vs New Report v2)
  insert into public.research_comparisons (old_report_id, new_report_id, comparison_result, created_at) values
    (v_report1_id, v_report2_id, '{
      "summary_of_changes": "Significant shift from theoretical transcription tools to FDA-regulated autonomous diagnostic pipelines and prospective clinical trials.",
      "unchanged_facts": [
        "Convolutional neural networks remain standard for single-modality radiology imaging.",
        "Algorithmic demographic bias and interoperability challenges remain major barriers."
      ],
      "new_developments": [
        "First randomized prospective clinical trial published in JAMA proving 40% diagnostic speedup.",
        "FDA issued definitive October 2026 guidance for adaptive, non-static medical algorithms.",
        "Multimodal models integrating genomics with radiology achieved 97.4% concordance."
      ],
      "outdated_information": [
        "Claim that regulatory pathways only permit static frozen models is now obsolete due to the October 2026 FDA update."
      ],
      "recommended_additions": [
        "Cite the recent JAMA clinical trial.",
        "Include the new liability risk matrix for attending physicians."
      ]
    }'::jsonb, now() - interval '50 minutes');

  -- 10. Collaboration System Data
  insert into public.collaborations (id, researcher_a, researcher_b, research_topic, status, created_at) values
    (uuid_generate_v4(), v_collab_user_id, v_user_id, 'Impact of AI on Healthcare Diagnostics', 'accepted', now() - interval '3 days');

  -- 11. In-App Notifications
  insert into public.notifications (recipient_id, type, message, related_research_id, read_status, created_at) values
    (v_user_id, 'collaboration_alert', 'Dr. Alex Chen accepted your collaboration invite on "Impact of AI on Healthcare Diagnostics".', v_proj_id, false, now() - interval '2 days'),
    (v_user_id, 'duplicate_topic_alert', 'Similar Topic Detected: "Clinical Applications of AI" by Dr. Alex Chen has a 78% semantic match with your project.', v_proj_id, false, now() - interval '1 hour');

end $$;
