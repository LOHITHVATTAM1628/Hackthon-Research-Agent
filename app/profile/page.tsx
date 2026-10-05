'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import {
  User,
  Shield,
  Clock,
  Sparkles,
  RefreshCw,
  FileText,
  GitCompare,
  ArrowRight,
  ExternalLink,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Sliders,
  Layers,
  Archive,
} from 'lucide-react';

interface ProjectHistoryItem {
  id: string;
  topic: string;
  status: 'idle' | 'researching' | 'completed' | 'updating' | 'failed';
  created_at: string;
  updated_at: string;
  latest_run_id?: string;
  versions_count: number;
}

const DEMO_PROJECTS: ProjectHistoryItem[] = [
  {
    id: 'a4a311b9-4284-4374-a856-f78217e022ea',
    topic: 'Impact of AI on Healthcare Diagnostics',
    status: 'completed',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    latest_run_id: 'a4a311b9-4284-4374-a856-f78217e022ea',
    versions_count: 2,
  },
  {
    id: 'proj-battery-density',
    topic: 'Solid-State Battery Energy Density & Production Bottlenecks',
    status: 'completed',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    latest_run_id: 'run-battery-v1',
    versions_count: 1,
  },
  {
    id: 'proj-multi-agent-consensus',
    topic: 'Multi-Agent System Architectures & Consensus in 2026',
    status: 'completed',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    latest_run_id: 'run-consensus-v2',
    versions_count: 3,
  },
  {
    id: 'proj-post-quantum',
    topic: 'Post-Quantum Cryptography Migration for Financial Systems',
    status: 'completed',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    latest_run_id: 'run-crypto-v1',
    versions_count: 1,
  },
];

export default function ProfileHistoryPage() {
  const { user, profile, role } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();

  const [projects, setProjects] = useState<ProjectHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');

  // Re-research modal state
  const [reResearchProject, setReResearchProject] = useState<ProjectHistoryItem | null>(null);
  const [focusPrompt, setFocusPrompt] = useState('');
  const [isEvolving, setIsEvolving] = useState(false);

  const fetchProfileProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/research/check-topic');
      const data = await res.json();

      if (Array.isArray(data.matches) && data.matches.length > 0) {
        const mapped: ProjectHistoryItem[] = data.matches.map((m: any) => ({
          id: m.id,
          topic: m.topic,
          status: m.status || 'completed',
          created_at: m.created_at || new Date().toISOString(),
          updated_at: m.updated_at || m.created_at || new Date().toISOString(),
          latest_run_id: m.latestRunId || m.id,
          versions_count: 2,
        }));
        setProjects(mapped);
      } else {
        setProjects(DEMO_PROJECTS);
      }
    } catch {
      setProjects(DEMO_PROJECTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileProjects();
  }, [fetchProfileProjects]);

  const handleLaunchReResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reResearchProject) return;

    setIsEvolving(true);
    try {
      const res = await fetch('/api/research/re-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: reResearchProject.id,
          focusPrompt: focusPrompt.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start re-research run');

      addToast(
        `Evolution Swarm successfully evolved "${reResearchProject.topic}" to Version ${data.targetVersion}.0!`,
        'success'
      );

      setReResearchProject(null);
      setFocusPrompt('');
      router.push(`/research/${reResearchProject.id}/evolution`);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      addToast(error.message, 'error');
    } finally {
      setIsEvolving(false);
    }
  };

  // Filter projects by query and status
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const memberSinceFormatted = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'October 2026';

  const totalRuns = projects.reduce((acc, p) => acc + (p.versions_count || 1), 0);

  return (
    <div className="profile-page-wrapper">
      {/* 1. Researcher Profile Header Card */}
      <section className="profile-header-card">
        <div className="profile-header-content">
          <div className="profile-avatar-large">
            <User size={38} className="text-orange" />
          </div>

          <div className="profile-identity-details">
            <div className="profile-role-tag-row">
              <span className={`role-badge-pill ${role === 'admin' ? 'admin' : 'researcher'}`}>
                {role === 'admin' ? <Shield size={12} /> : <Sparkles size={12} />}
                <span>{role === 'admin' ? 'Principal Administrator' : 'Lead Researcher'}</span>
              </span>
              <span className="member-since-date">
                <Calendar size={13} />
                <span>Member since {memberSinceFormatted}</span>
              </span>
            </div>

            <h1 className="profile-user-name">
              {profile?.name || (user?.user_metadata?.name as string) || user?.email?.split('@')[0] || 'Dr. Lohith'}
            </h1>
            <p className="profile-user-email">
              {user?.email || 'lead.researcher@livingresearch.ai'}
            </p>
          </div>
        </div>

        {/* Profile Metrics Ribbon */}
        <div className="profile-metrics-ribbon">
          <div className="profile-metric-cell">
            <div className="metric-val">{projects.length}</div>
            <div className="metric-lbl">Research Inquiries</div>
          </div>
          <div className="profile-metric-cell">
            <div className="metric-val text-cyan">{totalRuns}</div>
            <div className="metric-lbl">Version Iterations</div>
          </div>
          <div className="profile-metric-cell">
            <div className="metric-val text-emerald">
              {projects.filter((p) => p.status === 'completed').length}
            </div>
            <div className="metric-lbl">Completed Publications</div>
          </div>
        </div>
      </section>

      {/* 2. Research Archive Header & Controls */}
      <section className="archive-controls-row">
        <div className="archive-title-group">
          <div className="section-badge">
            <Archive size={14} className="text-orange" />
            <span>Empirical Knowledge Base</span>
          </div>
          <h2 className="archive-section-title">Research Project Archive & Version History</h2>
          <p className="archive-section-subtitle">
            Catalog of all your autonomous multi-agent investigations, timestamps, runs, and chronological version evolutions.
          </p>
        </div>

        <div className="archive-filter-tools">
          {/* Search Input */}
          <div className="archive-search-box">
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Search past research topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="archive-search-input"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="status-filter-pills">
            {['all', 'completed', 'updating', 'researching'].map((st) => (
              <button
                key={st}
                type="button"
                className={`filter-pill-btn ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchProfileProjects}
            disabled={loading}
            title="Refresh history"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </section>

      {/* 3. Catalog Grid / Data Table */}
      <main className="archive-catalog-area">
        {loading ? (
          <div className="catalog-loading-state">
            <Loader2 size={36} className="animate-spin text-orange mb-3" />
            <p className="text-secondary">Retrieving research archive and version telemetry...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-archive-card">
            <Archive size={40} className="text-muted mb-3" />
            <h3 className="empty-title">No Matching Research Projects Found</h3>
            <p className="empty-desc">
              Try adjusting your search terms or filters, or launch a new autonomous inquiry from your workspace.
            </p>
            <Link href="/dashboard" className="btn btn-primary mt-4">
              <span>Start New Inquiry</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="archive-grid">
            {filteredProjects.map((proj) => {
              const createdDate = new Date(proj.created_at).toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const createdTime = new Date(proj.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              const updatedDate = new Date(proj.updated_at).toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const updatedTime = new Date(proj.updated_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              const reportLink = `/research/${proj.latest_run_id || proj.id}/report`;
              const evolutionLink = `/research/${proj.id}/evolution`;

              return (
                <div key={proj.id} className="archive-card">
                  <div className="archive-card-top">
                    <div className="version-pill-group">
                      <span className="version-badge">
                        <Layers size={12} className="text-cyan" />
                        <span>v{proj.versions_count}.0</span>
                      </span>
                      <span className={`status-badge-micro ${proj.status}`}>
                        {proj.status.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="archive-project-topic">"{proj.topic}"</h3>
                  </div>

                  <div className="archive-timestamps-box">
                    <div className="timestamp-row">
                      <span className="timestamp-label">Initiated:</span>
                      <span className="timestamp-val">
                        <Calendar size={12} />
                        {createdDate}, {createdTime}
                      </span>
                    </div>
                    <div className="timestamp-row">
                      <span className="timestamp-label">Last Refreshed:</span>
                      <span className="timestamp-val text-cyan">
                        <Clock size={12} />
                        {updatedDate}, {updatedTime}
                      </span>
                    </div>
                  </div>

                  <div className="archive-card-actions">
                    <Link
                      href={reportLink}
                      className="btn btn-primary btn-sm"
                      title="Open latest publication report"
                    >
                      <FileText size={14} />
                      <span>Latest Report</span>
                    </Link>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setReResearchProject(proj)}
                      title="Run Re-Research evolution on this topic"
                    >
                      <RefreshCw size={14} className="text-orange" />
                      <span>Re-Research</span>
                    </button>

                    <Link
                      href={evolutionLink}
                      className="btn btn-secondary btn-sm"
                      title="View semantic evolution diff"
                    >
                      <GitCompare size={14} className="text-cyan" />
                      <span>Compare</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 4. RE-RESEARCH EVOLUTION MODAL */}
      {reResearchProject && (
        <div className="modal-backdrop-blur">
          <div className="modal-dialog-card re-research-modal" role="dialog" aria-modal="true">
            <div className="modal-header-alert">
              <div className="alert-icon-ring cyan">
                <RefreshCw size={24} className="text-cyan" />
              </div>
              <div>
                <h3 className="modal-title">Trigger Re-Research Evolution</h3>
                <p className="modal-subtext">
                  Rerun the 4-agent swarm to index fresh real-world discoveries and extract an automated semantic diff.
                </p>
              </div>
            </div>

            <form onSubmit={handleLaunchReResearch} className="modal-body-form">
              <div className="re-research-context-box">
                <div className="context-field">
                  <span className="context-label">Research Topic:</span>
                  <p className="context-value">"{reResearchProject.topic}"</p>
                </div>
                <div className="context-version-shift">
                  <span className="version-tag old">Current: v{reResearchProject.versions_count}.0</span>
                  <ArrowRight size={14} className="text-cyan" />
                  <span className="version-tag new">Target: v{reResearchProject.versions_count + 1}.0</span>
                </div>
              </div>

              <label className="input-label" htmlFor="focus-prompt-input">
                Evolution Focus Instructions (Optional):
              </label>
              <textarea
                id="focus-prompt-input"
                rows={3}
                className="collab-note-textarea"
                placeholder="e.g. Focus on latest 2026 benchmarks, clinical trials, or new market entries..."
                value={focusPrompt}
                onChange={(e) => setFocusPrompt(e.target.value)}
                disabled={isEvolving}
              />

              <div className="modal-actions-right">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setReResearchProject(null)}
                  disabled={isEvolving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isEvolving}
                >
                  {isEvolving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Evolving Research...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Launch Evolution Swarm</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
