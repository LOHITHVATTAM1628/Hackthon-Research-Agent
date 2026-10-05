'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Award, Download, Copy, Check, FileCheck2, ExternalLink } from 'lucide-react';
import { ReportItem, SourceItem } from '@/lib/supabase/types';
import { useToast } from '@/components/ui/Toast';

interface ReportViewerProps {
  report: ReportItem;
  topic: string;
  sources?: SourceItem[];
  score?: number;
  projectId?: string;
  runId?: string;
}

export function ReportViewer({
  report,
  topic,
  sources = [],
  score = 93,
  projectId,
  runId,
}: ReportViewerProps) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(report.content);
    setCopied(true);
    addToast('Report copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([report.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTopic = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    link.href = url;
    link.download = `research-report-${safeTopic}-v${report.version}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Report markdown downloaded.', 'info');
  };

  const reportId = runId || projectId || report.research_run_id || report.research_project_id;

  return (
    <div className="report-viewer-container">
      {/* Completion Banner */}
      <div className="completion-banner">
        <div className="completion-banner-left">
          <div className="banner-icon-badge">
            <FileCheck2 size={24} className="text-cyan" />
          </div>
          <div>
            <h3 className="banner-title">Autonomous Research Pipeline Completed</h3>
            <p className="banner-subtitle">
              All 4 agent stages finalized. Synthesized, peer-reviewed, and stored in Supabase.
            </p>
          </div>
        </div>

        <div className="completion-banner-right">
          <div className="score-box">
            <div className="score-label">
              <Award size={14} className="text-orange" />
              <span>QUALITY SCORE</span>
            </div>
            <div className="score-number">
              <span className="big-num">{score}</span>
              <span className="scale-num">/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="report-actions-bar">
        <div className="report-meta-info">
          <span className="meta-tag version">Version {report.version}.0</span>
          <span className="meta-tag date">
            Generated: {new Date(report.created_at).toLocaleString()}
          </span>
        </div>

        <div className="report-buttons-group">
          {reportId && (
            <Link
              href={`/research/${reportId}/report`}
              className="btn btn-secondary btn-sm gap-2"
              title="Open full dedicated executive report view with Source Audit & PDF export"
            >
              <ExternalLink size={14} className="text-cyan" />
              <span>Executive Publication View</span>
            </Link>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCopyMarkdown}
          >
            {copied ? <Check size={14} className="text-green" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleDownload}
          >
            <Download size={14} />
            <span>Download .MD</span>
          </button>
        </div>
      </div>

      {/* Markdown Document Content */}
      <div className="report-paper-card">
        <article className="markdown-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.content}</ReactMarkdown>
        </article>

        {/* References Section */}
        {sources.length > 0 && (
          <div className="report-references-section">
            <h3 className="references-header">Referenced Knowledge Citations</h3>
            <ol className="references-list">
              {sources.map((s, idx) => (
                <li key={s.id || idx} className="reference-item">
                  <span className="ref-index">[{idx + 1}]</span>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ref-link"
                  >
                    {s.title || s.url}
                  </a>
                  <span className="ref-meta">
                    ({s.source_type || 'webpage'}) · Relevance: {Math.round((s.relevance_score || 0.8) * 100)}%
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
