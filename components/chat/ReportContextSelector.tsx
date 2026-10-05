'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  ChevronDown,
  ExternalLink,
  Layers,
  Calendar,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { ReportOption } from '@/app/api/chat/compare/route';

interface ReportContextSelectorProps {
  reports: ReportOption[];
  selectedReportId: string;
  onSelectReport: (report: ReportOption) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function ReportContextSelector({
  reports,
  selectedReportId,
  onSelectReport,
  isLoading,
  onRefresh,
}: ReportContextSelectorProps) {
  const activeReport =
    reports.find((r) => r.id === selectedReportId) || reports[0] || null;

  return (
    <div className="report-context-selector-card">
      <div className="selector-header-row">
        <div className="selector-title-badge">
          <Layers size={14} className="text-orange" />
          <span>Grounded Report Context</span>
        </div>
        <div className="selector-actions">
          {onRefresh && (
            <button
              type="button"
              className="btn-icon-subtle"
              onClick={onRefresh}
              title="Refresh available reports"
              disabled={isLoading}
            >
              <RefreshCw size={13} className={isLoading ? 'spin-anim' : ''} />
            </button>
          )}
          {activeReport && activeReport.projectId && (
            <Link
              href={`/research/${activeReport.projectId}/report`}
              target="_blank"
              className="btn-view-report-link"
              title="Open full report in new tab"
            >
              <span>Audit Document</span>
              <ExternalLink size={12} />
            </Link>
          )}
        </div>
      </div>

      <div className="selector-dropdown-wrapper">
        <label htmlFor="report-select-input" className="selector-label">
          Active Report to Audit & Evolve:
        </label>
        <div className="select-container">
          <select
            id="report-select-input"
            className="report-select-input"
            value={activeReport?.id || ''}
            onChange={(e) => {
              const found = reports.find((r) => r.id === e.target.value);
              if (found) onSelectReport(found);
            }}
          >
            {reports.map((r) => (
              <option key={r.id} value={r.id}>
                {r.topic} (Version {r.version}.0 · {new Date(r.createdAt).toLocaleDateString()})
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="select-chevron-icon" />
        </div>
      </div>

      {activeReport && (
        <div className="active-report-meta-banner">
          <div className="meta-badge-row">
            <span className="version-pill">v{activeReport.version}.0</span>
            <span className="date-pill">
              <Calendar size={11} />
              <span>
                {new Date(activeReport.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </span>
            <span className="grounded-status-tag">
              <CheckCircle2 size={11} className="text-emerald" />
              <span>Context Grounded</span>
            </span>
          </div>
          {activeReport.summary && (
            <p className="active-report-summary">{activeReport.summary}</p>
          )}
        </div>
      )}
    </div>
  );
}
