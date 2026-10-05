'use client';

import React from 'react';
import { AlertCircle, FileText, Sparkles, ArrowRight, X, Clock } from 'lucide-react';

export interface DuplicateMatch {
  id: string;
  topic: string;
  status: string;
  created_at: string;
  latestRunId: string;
  runStatus: string;
}

interface DuplicateAlertModalProps {
  match: DuplicateMatch;
  onViewExisting: (runId: string) => void;
  onEvolve: (projectId: string) => void;
  onProceedAnyway: () => void;
  onClose: () => void;
}

export function DuplicateAlertModal({
  match,
  onViewExisting,
  onEvolve,
  onProceedAnyway,
  onClose,
}: DuplicateAlertModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card duplicate-modal">
        <div className="modal-header">
          <div className="flex-center gap-2">
            <AlertCircle size={20} className="text-orange" />
            <h3 className="text-white font-heading">Prior Research Investigation Detected</h3>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="text-muted text-sm mb-3">
            An identical or closely related research inquiry already exists in the system database:
          </p>

          <div className="duplicate-info-card">
            <div className="font-semibold text-white mb-1">{match.topic}</div>
            <div className="flex-center gap-3 text-xs text-secondary mono-text">
              <span>
                <Clock size={12} className="inline mr-1" />
                {new Date(match.created_at).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span>· Status: <strong className="text-emerald">{match.status.toUpperCase()}</strong></span>
            </div>
          </div>

          <p className="text-sm text-secondary mb-4">
            How would you like to proceed?
          </p>

          <div className="duplicate-actions-stack">
            <button
              type="button"
              className="action-option-btn primary"
              onClick={() => onViewExisting(match.latestRunId)}
            >
              <div className="flex-center gap-3">
                <FileText size={18} className="text-cyan" />
                <div className="text-left">
                  <div className="font-semibold text-white">View Existing Report</div>
                  <div className="text-xs text-muted">Read synthesized findings and critic audit scores immediately</div>
                </div>
              </div>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="action-option-btn highlight"
              onClick={() => onEvolve(match.id)}
            >
              <div className="flex-center gap-3">
                <Sparkles size={18} className="text-orange" />
                <div className="text-left">
                  <div className="font-semibold text-white">Evolve to Version 2.0 (Re-Research)</div>
                  <div className="text-xs text-muted">Scan the web for fresh updates and generate a diffed next-generation version</div>
                </div>
              </div>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="action-option-btn neutral"
              onClick={onProceedAnyway}
            >
              <div className="text-left">
                <div className="font-semibold text-secondary">Launch Fresh Independent Swarm</div>
                <div className="text-xs text-muted">Create a distinct, parallel research project from scratch</div>
              </div>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
