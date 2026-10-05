'use client';

import React from 'react';
import { ExternalLink, Bookmark, CheckCircle, FileText, Globe } from 'lucide-react';
import { SourceItem } from '@/lib/supabase/types';

interface SourcesListProps {
  sources: SourceItem[];
}

export function SourcesList({ sources }: SourcesListProps) {
  const getDomain = (urlStr: string) => {
    try {
      return new URL(urlStr).hostname.replace('www.', '');
    } catch {
      return 'web';
    }
  };

  const formatScore = (score: number | null) => {
    if (score === null || score === undefined) return '80%';
    const pct = score <= 1.0 ? Math.round(score * 100) : Math.round(score);
    return `${pct}%`;
  };

  return (
    <div className="sources-list-card">
      <div className="sources-card-header">
        <div className="flex-center gap-2">
          <Bookmark size={18} className="text-orange" />
          <h3 className="section-title-sm">Discovered Knowledge Sources ({sources.length})</h3>
        </div>
        <span className="mono-subtext">Verified by Search & Reader Agents</span>
      </div>

      {sources.length === 0 ? (
        <div className="empty-sources-state">
          <Globe size={32} className="text-gray mb-2 animate-pulse" />
          <p className="text-muted">Awaiting web scan results from Tavily...</p>
        </div>
      ) : (
        <div className="sources-table-container">
          <table className="sources-table">
            <thead>
              <tr>
                <th>Source & Domain</th>
                <th>Type</th>
                <th>Relevance</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => {
                const domain = getDomain(source.url);
                const scoreText = formatScore(source.relevance_score);

                return (
                  <tr key={source.id} className="source-row">
                    <td className="source-meta-cell">
                      <div className="source-title font-medium">{source.title || 'Untitled Source'}</div>
                      <div className="source-domain text-muted mono-text">{domain}</div>
                    </td>
                    <td className="source-type-cell">
                      <span className="source-type-pill">
                        <FileText size={11} />
                        {source.source_type || 'webpage'}
                      </span>
                    </td>
                    <td className="source-score-cell">
                      <div className="score-badge">
                        <CheckCircle size={12} className="text-cyan" />
                        <span>{scoreText}</span>
                      </div>
                    </td>
                    <td className="source-action-cell">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="source-external-link"
                        title="Visit source website"
                      >
                        <ExternalLink size={15} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
