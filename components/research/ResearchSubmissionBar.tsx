'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Loader2, Compass } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { SimilarTopicModal } from '@/components/collaboration/SimilarTopicModal';
import { SimilarTopicMatch } from '@/lib/services/topic-similarity';
import { useAuth } from '@/context/AuthContext';

const SUGGESTIONS = [
  'Multi-Agent System Architectures & Consensus in 2026',
  'Post-Quantum Cryptography Migration for Financial Systems',
  'Solid-State Battery Energy Density & Production Bottlenecks',
  'Neuromorphic Computing & Event-Based Vision AI',
];

interface ResearchSubmissionBarProps {
  onLaunched?: (runId: string, projectId: string) => void;
  compact?: boolean;
}

export function ResearchSubmissionBar({ onLaunched, compact = false }: ResearchSubmissionBarProps) {
  const { user, profile } = useAuth();
  const [topic, setTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [similarMatch, setSimilarMatch] = useState<SimilarTopicMatch | null>(null);

  const router = useRouter();
  const { addToast } = useToast();

  const executeLaunch = async (topicStr: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/research/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicStr,
          userId: user?.id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start research run');
      }

      addToast('Autonomous Research Pipeline Launched!', 'success');

      if (onLaunched) {
        onLaunched(data.runId, data.projectId);
      } else {
        router.push(`/research/${data.runId}`);
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      addToast(error.message, 'error');
      setIsSubmitting(false);
    }
  };

  const handleLaunchCheck = async (topicToRun?: string) => {
    const finalTopic = (topicToRun || topic).trim();
    if (!finalTopic) {
      addToast('Please enter a topic to launch research.', 'error');
      return;
    }

    if (finalTopic.length < 3) {
      addToast('Topic must be at least 3 characters long.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Check for semantic overlap / similar topic in public.research_projects
      const simRes = await fetch('/api/research/check-similarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: finalTopic,
          currentUserId: user?.id,
        }),
      });

      if (simRes.ok) {
        const simData = await simRes.json();
        if (simData.isSimilar && simData.match) {
          setIsSubmitting(false);
          setSimilarMatch(simData.match);
          return;
        }
      }

      // No similarity detected (or below threshold), proceed to launch
      await executeLaunch(finalTopic);
    } catch {
      // In case check fails or times out, proceed directly
      await executeLaunch(finalTopic);
    }
  };

  const handleRequestCollaboration = async (match: SimilarTopicMatch) => {
    try {
      const res = await fetch('/api/collaborations/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: match.projectId,
          researcherAId: match.authorId || match.author?.id,
          candidateTopic: topic.trim() || match.topic,
          senderUserId: user?.id,
          senderName: profile?.name || user?.email?.split('@')[0] || 'Peer Researcher',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch collaboration invitation');
      }

      addToast(`Collaboration request sent to ${match.author.name}! A notification has been delivered.`, 'success');
      setSimilarMatch(null);
      setTopic('');
      router.push('/collaborations');
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      addToast(error.message, 'error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLaunchCheck();
  };

  return (
    <>
      <div className={`submission-bar-wrapper ${compact ? 'compact' : ''}`}>
        <form onSubmit={handleSubmit} className="submission-bar-form">
          <div className="input-glow-container">
            <div className="search-icon-prefix">
              <Sparkles size={20} className="text-orange" />
            </div>
            <input
              type="text"
              className="research-topic-input"
              placeholder="Enter research topic, technology, or empirical question..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !topic.trim()}
              className="btn btn-primary launch-btn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Launching...</span>
                </>
              ) : (
                <>
                  <span>Launch Autonomous Pipeline</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>

        {!compact && (
          <div className="suggestion-chips-container">
            <div className="suggestion-label">
              <Compass size={14} />
              <span>Suggested Inquiries:</span>
            </div>
            <div className="chips-list">
              {SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="chip-btn"
                  onClick={() => {
                    setTopic(item);
                    handleLaunchCheck(item);
                  }}
                  disabled={isSubmitting}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {similarMatch && (
        <SimilarTopicModal
          match={similarMatch}
          candidateTopic={topic}
          onProceedIndependently={() => {
            const topicToRun = topic;
            setSimilarMatch(null);
            executeLaunch(topicToRun);
          }}
          onRequestCollaboration={handleRequestCollaboration}
          onClose={() => setSimilarMatch(null)}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}
