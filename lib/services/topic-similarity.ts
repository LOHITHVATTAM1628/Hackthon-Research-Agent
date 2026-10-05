/**
 * Semantic Topic Similarity & Duplicate Detection Service
 * Evaluates topic overlap using token Jaccard similarity and Groq fast classification.
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { callGroq } from '@/lib/agents/llm';

export interface SimilarTopicMatch {
  projectId: string;
  topic: string;
  status: string;
  createdAt: string;
  similarityScore: number;
  semanticReason: string;
  authorId?: string;
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  latestRunId?: string;
  runStatus?: string;
}

export interface TopicSimilarityResult {
  isSimilar: boolean;
  match: SimilarTopicMatch | null;
  allMatches?: SimilarTopicMatch[];
}

// Common stop words to strip for token analysis
const STOP_WORDS = new Set([
  'a', 'about', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'how', 'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to',
  'was', 'what', 'when', 'where', 'which', 'who', 'will', 'with', 'the'
]);

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/artificial\s+intelligence/g, 'ai')
    .replace(/machine\s+learning/g, 'ml')
    .replace(/large\s+language\s+models?/g, 'llm')
    .replace(/natural\s+language\s+processing/g, 'nlp')
    .replace(/post-?quantum/g, 'postquantum');
}

function tokenize(text: string): Set<string> {
  const normalized = normalizeText(text);
  const words = normalized
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  return new Set(words);
}

function computeJaccard(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  setA.forEach((w) => {
    if (setB.has(w)) intersection++;
  });
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

const isPlaceholderUrl = (url?: string) =>
  !url || url.includes('your-project-id') || url.includes('placeholder');

const DEFAULT_PLATFORM_PROJECTS = [
  {
    id: 'a4a311b9-4284-4374-a856-f78217e022ea',
    user_id: 'user-elena-vance',
    topic: 'Impact of AI on Healthcare Diagnostics',
    status: 'completed',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'proj-battery-tech',
    user_id: 'user-marcus-chen',
    topic: 'Solid-State Battery Energy Density & Production Bottlenecks',
    status: 'running',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'proj-crypto-post',
    user_id: 'user-sarah-jenkins',
    topic: 'Post-Quantum Cryptography Migration for Financial Systems',
    status: 'completed',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
];

export async function checkTopicSimilarity(
  candidateTopic: string,
  currentUserId?: string
): Promise<TopicSimilarityResult> {
  if (!candidateTopic || typeof candidateTopic !== 'string' || candidateTopic.trim().length < 3) {
    return { isSimilar: false, match: null };
  }

  const cleanCandidate = candidateTopic.trim();
  let projects: typeof DEFAULT_PLATFORM_PROJECTS = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. Fetch recent projects from Supabase if configured
  if (!isPlaceholderUrl(supabaseUrl)) {
    try {
      let query = supabaseAdmin
        .from('research_projects')
        .select('id, user_id, topic, status, created_at')
        .order('created_at', { ascending: false })
        .limit(40);

      if (currentUserId) {
        query = query.neq('user_id', currentUserId);
      }

      const { data: dbProjects, error } = await query;
      if (!error && dbProjects && dbProjects.length > 0) {
        projects = dbProjects;
      }
    } catch (sbErr) {
      console.warn('Supabase projects query fallback:', sbErr);
    }
  }

  // Fallback to platform active projects if no Supabase records available
  if (projects.length === 0) {
    projects = DEFAULT_PLATFORM_PROJECTS.filter(
      (p) => !currentUserId || p.user_id !== currentUserId
    );
  }

  if (projects.length === 0) {
    return { isSimilar: false, match: null };
  }

  const candidateTokens = tokenize(cleanCandidate);
  const candidateLower = cleanCandidate.toLowerCase();

  // 2. Pre-filter candidates with substring or token overlap
  const preliminaryCandidates: typeof projects = [];

  for (const proj of projects) {
    const projLower = (proj.topic || '').toLowerCase();

    // Exact or substring match immediately candidates
    if (projLower === candidateLower || projLower.includes(candidateLower) || candidateLower.includes(projLower)) {
      preliminaryCandidates.push(proj);
      continue;
    }

    const projTokens = tokenize(projLower);
    const jaccard = computeJaccard(candidateTokens, projTokens);

    let shared = 0;
    candidateTokens.forEach((t) => {
      if (projTokens.has(t)) shared++;
    });

    if (jaccard >= 0.2 || shared >= 1) {
      preliminaryCandidates.push(proj);
    }
  }

  if (preliminaryCandidates.length === 0) {
    return { isSimilar: false, match: null };
  }

  // 3. For top preliminary matches, perform Groq semantic evaluation
  const topCandidate = preliminaryCandidates[0];
  const topCandidateTopic = topCandidate.topic;

  let similarityScore = 0.85;
  let semanticReason = `High topical overlap identified with existing project "${topCandidateTopic}".`;

  try {
    const evalPrompt = `You are a Semantic Duplicate Detector for a scientific and academic research platform.
Compare these two research inquiry topics:
Topic A (Candidate): "${cleanCandidate}"
Topic B (Existing Project): "${topCandidateTopic}"

Evaluate if Topic A and Topic B represent the same fundamental research question, subject matter, or overlapping inquiry (e.g. "AI in Healthcare" and "Impact of Artificial Intelligence on Healthcare" have >90% semantic overlap).

Respond STRICTLY in JSON format with no markdown wrappers:
{
  "similarityScore": <number between 0.0 and 1.0>,
  "isDuplicate": <boolean, true if similarityScore >= 0.70>,
  "reason": "<concise 1-sentence explanation of why these topics overlap or differ>"
}`;

    const groqPromise = callGroq([
      { role: 'system', content: 'You are a precise JSON semantic comparator.' },
      { role: 'user', content: evalPrompt },
    ], { temperature: 0.1, max_tokens: 200 });

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Groq classifier timeout')), 2500)
    );

    const rawResponse = await Promise.race([groqPromise, timeoutPromise]);

    const cleaned = rawResponse.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (typeof parsed.similarityScore === 'number') {
      similarityScore = parsed.similarityScore;
    }
    if (parsed.reason) {
      semanticReason = parsed.reason;
    }
  } catch (llmErr) {
    // If LLM call fails, fallback to computed token overlap
    const topTokens = tokenize(topCandidateTopic);
    const jaccard = computeJaccard(candidateTokens, topTokens);
    similarityScore = Math.max(0.75, Number((jaccard + 0.35).toFixed(2)));
    semanticReason = `Substantial terminology and domain overlap with existing investigation "${topCandidateTopic}".`;
  }

  // Threshold: >= 0.70 triggers duplicate / collaboration workflow
  if (similarityScore < 0.70) {
    return { isSimilar: false, match: null };
  }

  // 4. Fetch author info for topCandidate
  let author = {
    id: topCandidate.user_id || 'unknown',
    name: 'Researcher',
    email: 'researcher@livingresearch.ai',
    role: 'researcher',
  };

  if (topCandidate.user_id) {
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role')
      .eq('id', topCandidate.user_id)
      .maybeSingle();

    if (userData) {
      author = {
        id: userData.id,
        name: userData.name || userData.email.split('@')[0],
        email: userData.email,
        role: userData.role || 'researcher',
      };
    }
  }

  // 5. Fetch latest run status
  const { data: latestRun } = await supabaseAdmin
    .from('research_runs')
    .select('id, status')
    .eq('research_project_id', topCandidate.id)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const match: SimilarTopicMatch = {
    projectId: topCandidate.id,
    topic: topCandidate.topic,
    status: topCandidate.status,
    createdAt: topCandidate.created_at,
    similarityScore: Number(similarityScore.toFixed(2)),
    semanticReason,
    authorId: author.id,
    author,
    latestRunId: latestRun?.id || topCandidate.id,
    runStatus: latestRun?.status || topCandidate.status,
  };

  return {
    isSimilar: true,
    match,
  };
}
