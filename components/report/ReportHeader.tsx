'use client';

import React from 'react';
import { Award, User, Calendar, CheckCircle2, ChevronDown, Layers, Sparkles } from 'lucide-react';
import { ReportItem } from '@/lib/supabase/types';

interface ReportHeaderProps {
  topic: string;
  author: {
    name: string;
    email: string;
    role: string;
  };
  reports: ReportItem[];
  activeVersion: number;
  onVersionChange: (version: number) => void;
  status: string;
  completedAt?: string | null;
  score: number;
}

export function ReportHeader({
  topic,
  author,
  reports,
  activeVersion,
  onVersionChange,
  status = 'completed',
  completedAt,
  score = 94,
}: ReportHeaderProps) {
  const formattedDate = completedAt
    ? new Date(completedAt).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  const getScoreColorClass = (s: number) => {
    if (s >= 88) return 'score-green';
    if (s >= 75) return 'score-amber';
    return 'score-rose';
  };

  return (
    <header className="report-header-banner">
      <div className="report-header-top">
        <div className="report-badge-cluster">
          <span className="executive-tag">
            <Sparkles size={12} className="text-cyan" />
            <span>EXECUTIVE RESEARCH PUBLICATION</span>
          </span>
          <span className={`status-pill ${status === 'completed' ? 'completed' : 'running'}`}>
            <CheckCircle2 size={12} />
            {status.toUpperCase()}
          </span>
        </div>

        <div className="report-header-score-wrapper">
          <div className={`critic-score-chip ${getScoreColorClass(score)}`}>
            <div className="chip-icon">
              <Award size={18} />
            </div>
            <div className="chip-content">
              <span className="chip-label">CRITIC QUALITY SCORE</span>
              <div className="chip-value">
                <strong>{score}</strong>
                <span>/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h1 className="report-main-title">{topic}</h1>

      <div className="report-metadata-ribbon">
        {/* Author info */}
        <div className="meta-ribbon-item author-item">
          <div className="author-avatar-badge">
            <User size={14} />
          </div>
          <div className="author-details">
            <span className="author-name">{author.name}</span>
            <span className="author-role">{author.role || 'Principal Investigator'}</span>
          </div>
        </div>

        <div className="meta-ribbon-divider" />

        {/* Version Selector */}
        <div className="meta-ribbon-item version-item">
          <Layers size={14} className="text-cyan" />
          <div className="version-select-container">
            <span className="meta-label">Version</span>
            <div className="version-select-wrapper">
              <select
                id="report-version-dropdown"
                value={activeVersion}
                onChange={(e) => onVersionChange(parseInt(e.target.value, 10))}
                className="version-dropdown-select"
              >
                {reports.map((rep) => (
                  <option key={rep.version} value={rep.version}>
                    v{rep.version}.0 {rep.version === reports[0]?.version ? '(Latest)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="dropdown-caret" />
            </div>
          </div>
        </div>

        <div className="meta-ribbon-divider" />

        {/* Timestamp */}
        <div className="meta-ribbon-item date-item">
          <Calendar size={14} className="text-muted" />
          <div className="date-details">
            <span className="meta-label">Completed</span>
            <span className="meta-value">{formattedDate}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
