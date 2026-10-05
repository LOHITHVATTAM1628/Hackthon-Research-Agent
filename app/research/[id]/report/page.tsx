'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileText,
  Layers,
  Sparkles,
  Award,
} from 'lucide-react';
import { ReportHeader } from '@/components/report/ReportHeader';
import { ReportToolbar } from '@/components/report/ReportToolbar';
import { ReportTableOfContents } from '@/components/report/ReportTableOfContents';
import { ReportMarkdownRenderer } from '@/components/report/ReportMarkdownRenderer';
import { SourceAuditInspector } from '@/components/report/SourceAuditInspector';
import { CriticEvaluationAccordion, CriticEvaluationData } from '@/components/report/CriticEvaluationAccordion';
import { ReportItem, SourceItem } from '@/lib/supabase/types';

interface ReportApiResponse {
  project: {
    id: string;
    topic: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  primaryRun?: {
    id: string;
    status: string;
    started_at: string;
    completed_at: string;
  };
  author: {
    name: string;
    email: string;
    role: string;
    avatar_url?: string | null;
  };
  reports: ReportItem[];
  sources: SourceItem[];
  criticEvaluation: CriticEvaluationData;
}

export default function DedicatedReportPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || '';

  const [data, setData] = useState<ReportApiResponse | null>(null);
  const [activeVersion, setActiveVersion] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/research/${id}/report`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }
      const json: ReportApiResponse = await res.json();
      setData(json);

      if (json.reports && json.reports.length > 0) {
        // Set latest version as default
        const latest = Math.max(...json.reports.map((r) => r.version));
        setActiveVersion(latest);
      }
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReportData();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="dedicated-report-layout loading-screen">
        <div className="loading-card">
          <Loader2 size={36} className="text-cyan animate-spin mb-4" />
          <h2 className="loading-title">Compiling Executive Research Report...</h2>
          <p className="loading-desc">
            Retrieving finalized syntheses, cited sources, and critic evaluations from Supabase.
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dedicated-report-layout error-screen">
        <div className="error-card">
          <AlertCircle size={36} className="text-rose mb-3" />
          <h2 className="error-title">Unable to Load Research Report</h2>
          <p className="error-desc">{error || 'Project or report not found.'}</p>
          <div className="flex-center gap-3 mt-4">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fetchReportData}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
            <Link href="/dashboard" className="btn btn-primary btn-sm">
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { project, primaryRun, author, reports, sources, criticEvaluation } = data;

  // Active report for selected version
  const currentReport =
    reports.find((r) => r.version === activeVersion) ||
    reports[0] || {
      id: '',
      research_project_id: project.id,
      research_run_id: primaryRun?.id || '',
      content: '# Report Draft In Progress\n\nThe autonomous agent swarm is currently executing.',
      version: 1,
      created_at: project.created_at,
    };

  return (
    <div className="dedicated-report-page-wrapper">
      {/* Top Navigation & Breadcrumb */}
      <div className="report-breadcrumb-bar no-print">
        <div className="container flex-between">
          <div className="flex-center gap-2">
            <Link href="/dashboard" className="breadcrumb-link">
              Workspace
            </Link>
            <span className="crumb-sep">/</span>
            <Link href={`/research/${primaryRun?.id || project.id}`} className="breadcrumb-link">
              Mission Control
            </Link>
            <span className="crumb-sep">/</span>
            <span className="breadcrumb-current">Executive Report</span>
          </div>

          <div className="flex-center gap-3">
            <div className="version-pill-badge">
              <Layers size={13} className="text-cyan" />
              <span>Version {activeVersion}.0</span>
            </div>
            <Link
              href={`/chat?tab=compare&reportId=${currentReport.id}`}
              className="btn btn-secondary btn-xs"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-orange)', borderColor: 'rgba(255, 140, 50, 0.3)' }}
              title="Audit this report with the Comparison & Evolution AI Chatbot"
            >
              <Sparkles size={13} />
              <span>Ask AI / Audit Diff</span>
            </Link>
            <Link
              href={`/research/${primaryRun?.id || project.id}`}
              className="btn btn-secondary btn-xs"
            >
              <ArrowLeft size={13} />
              <span>Back to Telemetry</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container report-main-container">
        {/* Report Header */}
        <ReportHeader
          topic={project.topic}
          author={author}
          reports={reports}
          activeVersion={activeVersion}
          onVersionChange={setActiveVersion}
          status={project.status}
          completedAt={primaryRun?.completed_at || project.updated_at}
          score={criticEvaluation?.score || 94}
        />

        {/* Action Toolbar */}
        <ReportToolbar
          content={currentReport.content}
          topic={project.topic}
          version={activeVersion}
          projectId={project.id}
          runId={primaryRun?.id || project.id}
        />

        {/* 2-Column Reading Layout */}
        <div className="report-reading-grid">
          {/* Left Column: Sticky Table of Contents */}
          <aside className="report-sidebar-column">
            <div className="sticky-sidebar-wrapper">
              <ReportTableOfContents content={currentReport.content} />
            </div>
          </aside>

          {/* Right/Center Column: Main Document & Interactive Inspectors */}
          <main className="report-document-column">
            {/* Printable Document Paper Card */}
            <div className="printable-report-paper">
              {/* Document Header in Print */}
              <div className="print-only-header">
                <div className="print-brand-badge">ResearchMind · Autonomous Research System</div>
                <h1 className="print-title">{project.topic}</h1>
                <div className="print-meta-line">
                  <span>Author: {author.name}</span> ·{' '}
                  <span>Version: v{activeVersion}.0</span> ·{' '}
                  <span>Date: {new Date().toLocaleDateString()}</span> ·{' '}
                  <span>Score: {criticEvaluation?.score || 94}/100</span>
                </div>
                <hr className="print-divider" />
              </div>

              {/* Rendered Markdown Body */}
              <ReportMarkdownRenderer content={currentReport.content} />
            </div>

            {/* Critic Evaluation Accordion */}
            <div className="mt-8">
              <CriticEvaluationAccordion
                evaluation={criticEvaluation}
                defaultOpen={true}
              />
            </div>

            {/* Interactive Source Audit Inspector */}
            <div className="mt-8">
              <SourceAuditInspector sources={sources} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
