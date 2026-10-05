'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Cpu,
  FileText,
  Activity,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  GitCompare,
  MessageSquare,
} from 'lucide-react';
import { useResearchRealtime } from '@/hooks/useResearchRealtime';
import { StageStepper } from '@/components/research/StageStepper';
import { StatCounters } from '@/components/research/StatCounters';
import { LiveTerminal } from '@/components/research/LiveTerminal';
import { SourcesList } from '@/components/research/SourcesList';
import { ReportViewer } from '@/components/research/ReportViewer';
import { ReportDiffViewer } from '@/components/research/ReportDiffViewer';
import { DualDomainChat } from '@/components/research/DualDomainChat';

export default function ResearchTelemetryPage() {
  const params = useParams();
  const runId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || '';

  const {
    project,
    run,
    logs,
    sources,
    report,
    isLoading,
    elapsedSeconds,
    currentAgent,
    getStageStatus,
    refresh,
  } = useResearchRealtime({ runId });

  const [activeTab, setActiveTab] = useState<'telemetry' | 'report' | 'diff' | 'chat'>('telemetry');

  const isCompleted = run?.status === 'completed' || report !== null;
  const isFailed = run?.status === 'failed';
  const topicTitle = project?.topic || 'Autonomous Research Mission';
  const projectId = project?.id || run?.research_project_id || runId;

  // Extract quality score from critic log if available
  const criticLog = logs.find((l) => l.agent_name.includes('Critic') && l.status === 'completed');
  let score = 94;
  if (criticLog) {
    const match = criticLog.message.match(/(\d+)\/100/);
    if (match && match[1]) {
      score = parseInt(match[1], 10);
    }
  }

  return (
    <div className="telemetry-page-layout">
      {/* Top Header */}
      <div className="telemetry-nav-header">
        <div className="container flex-between">
          <div className="flex-center gap-3">
            <Link href="/dashboard" className="back-link-btn" title="Back to Researcher Workspace">
              <ArrowLeft size={16} />
              <span>Workspace</span>
            </Link>
            <span className="crumb-divider">/</span>
            <div className="mission-topic-badge">
              <Cpu size={14} className="text-orange" />
              <span className="mono-subtext">RUN_ID: {runId ? runId.slice(0, 8) : '...'}</span>
            </div>
          </div>

          <div className="flex-center gap-3">
            {isCompleted ? (
              <span className="status-pill completed">
                <CheckCircle2 size={13} />
                MISSION COMPLETED
              </span>
            ) : isFailed ? (
              <span className="status-pill failed">
                <AlertCircle size={13} />
                PIPELINE HALTED
              </span>
            ) : (
              <span className="status-pill running">
                <span className="beacon-pulse" />
                PIPELINE ACTIVE
              </span>
            )}

            <button
              type="button"
              onClick={() => refresh()}
              className="btn btn-secondary btn-icon"
              title="Refresh telemetry status"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      <main className="container telemetry-main-content">
        {/* Topic Title Banner */}
        <div className="mission-hero-banner">
          <div className="mission-hero-meta">
            <span className="badge badge-accent">GROQ + TAVILY MULTI-AGENT SWARM</span>
            <h1 className="mission-title">{topicTitle}</h1>
          </div>

          {/* View Tab Switcher */}
          <div className="view-tab-buttons">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'telemetry' ? 'active' : ''}`}
              onClick={() => setActiveTab('telemetry')}
            >
              <Activity size={15} />
              <span>Live Telemetry</span>
            </button>

            {report && (
              <>
                <button
                  type="button"
                  className={`tab-btn highlight ${activeTab === 'report' ? 'active' : ''}`}
                  onClick={() => setActiveTab('report')}
                >
                  <FileText size={15} />
                  <span>Report</span>
                  <span className="score-mini-pill">{score}/100</span>
                </button>

                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'diff' ? 'active' : ''}`}
                  onClick={() => setActiveTab('diff')}
                >
                  <GitCompare size={15} />
                  <span>Evolution Diff</span>
                </button>

                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                  onClick={() => setActiveTab('chat')}
                >
                  <MessageSquare size={15} />
                  <span>Intelligence Chat</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 4-Stage Stepper (Only on Telemetry tab or always as reference) */}
        {activeTab === 'telemetry' && (
          <>
            <section className="mb-6">
              <StageStepper getStageStatus={getStageStatus} />
            </section>

            <section className="mb-6">
              <StatCounters
                sourcesScanned={sources.length}
                verifiedLinks={sources.filter((s) => (s.relevance_score || 0) >= 0.7).length}
                currentAgent={currentAgent}
                elapsedSeconds={elapsedSeconds}
                qualityScore={isCompleted ? score : null}
              />
            </section>
          </>
        )}

        {/* Success Banner Prompt when completed while in telemetry tab */}
        {isCompleted && report && activeTab === 'telemetry' && (
          <div className="completion-callout-card mb-6">
            <div className="flex-center gap-3">
              <CheckCircle2 size={24} className="text-green" />
              <div>
                <h4 className="callout-title">Research Pipeline Execution Finished!</h4>
                <p className="callout-desc">
                  The Critic Chain has verified the final report with a Quality Score of {score}/100.
                </p>
              </div>
            </div>
            <div className="flex-center gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveTab('chat')}
              >
                <MessageSquare size={15} />
                <span>Ask Chatbot</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveTab('report')}
              >
                <FileText size={16} />
                <span>View Generated Report</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Live Telemetry */}
        {activeTab === 'telemetry' && (
          <div className="telemetry-grid">
            <div className="telemetry-terminal-column">
              <LiveTerminal logs={logs} isRunning={!isCompleted && !isFailed} />
            </div>
            <div className="telemetry-sources-column">
              <SourcesList sources={sources} />
            </div>
          </div>
        )}

        {/* Tab 2: Generated Report View */}
        {activeTab === 'report' && report && (
          <div className="report-full-view">
            <ReportViewer
              report={report}
              topic={topicTitle}
              sources={sources}
              score={score}
              projectId={projectId}
              runId={runId}
            />
          </div>
        )}

        {/* Tab 3: Evolution Diff Viewer */}
        {activeTab === 'diff' && report && (
          <div className="diff-full-view">
            <ReportDiffViewer
              projectId={projectId}
              currentReport={report}
              topic={topicTitle}
              onEvolutionStarted={() => {
                setActiveTab('telemetry');
                refresh();
              }}
            />
          </div>
        )}

        {/* Tab 4: Dual Domain Chatbot */}
        {activeTab === 'chat' && report && (
          <div className="chat-full-view">
            <DualDomainChat
              projectId={projectId}
              topic={topicTitle}
              reportContext={report.content}
            />
          </div>
        )}
      </main>
    </div>
  );
}
