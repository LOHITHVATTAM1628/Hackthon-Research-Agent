'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  UserCheck,
  ArrowRight,
  ExternalLink,
  Loader2,
  Calendar,
  Sparkles,
  Users,
} from 'lucide-react';
import { SimilarTopicMatch } from '@/lib/services/topic-similarity';

interface SimilarTopicModalProps {
  match: SimilarTopicMatch;
  candidateTopic: string;
  onProceedIndependently: () => void;
  onRequestCollaboration: (match: SimilarTopicMatch) => Promise<void>;
  onClose: () => void;
  isSubmitting?: boolean;
}

export function SimilarTopicModal({
  match,
  candidateTopic,
  onProceedIndependently,
  onRequestCollaboration,
  onClose,
  isSubmitting = false,
}: SimilarTopicModalProps) {
  const [requesting, setRequesting] = useState(false);

  const handleCollaborationClick = async () => {
    setRequesting(true);
    try {
      await onRequestCollaboration(match);
    } finally {
      setRequesting(false);
    }
  };

  const scorePercent = Math.round(match.similarityScore * 100);

  const formattedDate = match.createdAt
    ? new Date(match.createdAt).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Recent';

  return (
    <div className="modal-backdrop-blur">
      <div className="modal-dialog-card similar-topic-modal" role="dialog" aria-modal="true">
        {/* Modal Header */}
        <div className="modal-header-alert">
          <div className="alert-icon-ring">
            <AlertTriangle size={24} className="text-orange" />
          </div>
          <div>
            <h3 className="modal-title">Similar Research Detected</h3>
            <p className="modal-subtext">
              An active or completed research project with high topical overlap was identified.
            </p>
          </div>
        </div>

        {/* Comparison Box */}
        <div className="similarity-details-box">
          <div className="similarity-score-bar-row">
            <span className="sim-label">Topical Overlap</span>
            <span className="sim-badge">
              <Sparkles size={12} className="text-cyan" />
              <strong>{scorePercent}% Semantic Match</strong>
            </span>
          </div>

          <div className="topics-comparison-grid">
            <div className="topic-block candidate">
              <span className="block-label">Your Proposed Inquiry:</span>
              <p className="block-text">"{candidateTopic}"</p>
            </div>

            <div className="topic-block existing">
              <span className="block-label">Existing Project:</span>
              <p className="block-text">"{match.topic}"</p>
            </div>
          </div>

          {/* Author & Status Metadata */}
          <div className="existing-meta-row">
            <div className="author-pill">
              <UserCheck size={14} className="text-cyan" />
              <span>
                Lead: <strong>{match.author.name}</strong> ({match.author.role})
              </span>
            </div>

            <div className="date-status-cluster">
              <span className="date-tag">
                <Calendar size={12} />
                {formattedDate}
              </span>
              <span className={`status-pill ${match.status === 'completed' ? 'completed' : 'running'}`}>
                {match.status.toUpperCase()}
              </span>
            </div>
          </div>

          {match.semanticReason && (
            <p className="semantic-reason-note">
              <strong>Analysis:</strong> {match.semanticReason}
            </p>
          )}

          {match.latestRunId && (
            <div className="view-existing-link-row">
              <a
                href={`/research/${match.latestRunId}/report`}
                target="_blank"
                rel="noopener noreferrer"
                className="view-existing-link"
              >
                <span>Preview Existing Findings in New Tab</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* Action Options */}
        <div className="similarity-actions-stack">
          {/* Option 1: Request Collaboration */}
          <button
            type="button"
            id="btn-request-collaboration"
            className="action-option-btn primary"
            onClick={handleCollaborationClick}
            disabled={requesting || isSubmitting}
          >
            <div className="btn-content">
              <div className="btn-title-row">
                <Users size={16} className="text-cyan" />
                <strong>Request Collaboration</strong>
                <span className="badge-recommend">Recommended</span>
              </div>
              <p className="btn-desc">
                Notify Researcher {match.author.name} to establish a shared workspace and avoid duplicated computation.
              </p>
            </div>
            {requesting ? <Loader2 size={16} className="animate-spin text-cyan" /> : <ArrowRight size={16} />}
          </button>

          {/* Option 2: Proceed Independently */}
          <button
            type="button"
            id="btn-proceed-independently"
            className="action-option-btn neutral"
            onClick={onProceedIndependently}
            disabled={requesting || isSubmitting}
          >
            <div className="btn-content">
              <div className="btn-title-row">
                <strong>Proceed Independently</strong>
              </div>
              <p className="btn-desc">
                Launch a fresh autonomous 4-stage pipeline for your topic without notifying the existing researcher.
              </p>
            </div>
            {isSubmitting ? <Loader2 size={16} className="animate-spin text-muted" /> : <ArrowRight size={16} />}
          </button>
        </div>

        {/* Close Button */}
        <div className="modal-footer-cancel">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={requesting || isSubmitting}
          >
            Cancel & Refine Topic
          </button>
        </div>
      </div>
    </div>
  );
}
