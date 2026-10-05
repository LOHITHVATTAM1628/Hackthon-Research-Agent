'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import {
  Sparkles,
  Activity,
  LogOut,
  User,
  Shield,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  RefreshCw,
} from 'lucide-react';
import { ResearchSubmissionBar } from '@/components/research/ResearchSubmissionBar';

interface DashboardProject {
  id: string;
  topic: string;
  status: string;
  created_at: string;
  latest_run_id?: string;
  latest_run_status?: string;
}

export default function ResearcherDashboard() {
  const { user, profile, role, signOut } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedRuns: 0,
    activeRuns: 0,
  });

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const url = user?.id ? `/api/research/projects?userId=${user.id}` : '/api/research/projects';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      if (Array.isArray(data.projects)) {
        setProjects(data.projects);
      }
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.warn('Error fetching dashboard projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(7, 7, 12, 0.85)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: '1300px',
            margin: '0 auto',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '9px',
                  background: 'linear-gradient(135deg, #ff8c32 0%, #ff521a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} color="#08080c" />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                }}
              >
                Research<span style={{ color: 'var(--accent-orange)' }}>Mind</span>
              </span>
            </Link>

            <span className="badge-pill" style={{ fontSize: '0.68rem' }}>
              Researcher Workspace
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {role === 'admin' && (
              <Link
                href="/admin"
                className="btn-secondary"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}
              >
                <Shield size={14} />
                Switch to Admin Panel
              </Link>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.8rem',
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <User size={15} color="var(--accent-orange)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                {profile?.name || user?.user_metadata?.name || user?.email || 'Researcher'}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="btn-secondary"
              style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem' }}
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '1300px', width: '100%', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Launch Autonomous Research Section */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div
            className="glass-card"
            style={{
              padding: '2.2rem',
              background:
                'radial-gradient(ellipse 70% 60% at 85% 15%, rgba(255, 140, 50, 0.15) 0%, rgba(18, 18, 29, 0.8) 70%)',
              border: '1px solid rgba(255, 140, 50, 0.25)',
            }}
          >
            <div style={{ marginBottom: '1.5rem' }}>
              <div className="badge-pill" style={{ marginBottom: '0.65rem' }}>
                Autonomous 4-Stage Research Pipeline
              </div>
              <h1 style={{ fontSize: '1.9rem', color: '#fff', marginBottom: '0.4rem' }}>
                Launch New Autonomous Investigation
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                Type a topic below to initiate query generation, Tavily live web scanning, Reader extraction, synthesis, and Critic scoring.
              </p>
            </div>

            <ResearchSubmissionBar
              onLaunched={(runId) => {
                router.push(`/research/${runId}`);
              }}
            />
          </div>
        </section>

        {/* Quick Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.5rem',
          }}
        >
          <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Total Research Inquiries</span>
              <FileText size={18} color="var(--accent-orange)" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.5rem', color: '#fff' }}>
              {stats.totalProjects}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Completed Reports</span>
              <CheckCircle2 size={18} color="var(--accent-emerald)" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.5rem', color: '#fff' }}>
              {stats.completedRuns}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Active Telemetry Runs</span>
              <Activity size={18} color="var(--accent-cyan)" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.5rem', color: '#fff' }}>
              {stats.activeRuns}
            </div>
          </div>
        </div>

        {/* Recent Research Runs Table */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#fff' }}>Recent Research Investigations</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                All topics recorded in Supabase with real-time status and report access
              </p>
            </div>
            <button
              type="button"
              onClick={fetchDashboardData}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
              title="Refresh project list"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Activity size={28} className="animate-pulse" style={{ margin: '0 auto 0.75rem' }} />
              <p>Fetching projects from Supabase...</p>
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Clock size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                No research runs launched yet
              </div>
              <p style={{ fontSize: '0.82rem', marginTop: '0.35rem' }}>
                Enter an inquiry in the bar above to launch your first autonomous multi-agent pipeline!
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>TOPIC</th>
                    <th style={{ padding: '0.75rem 1rem' }}>STATUS</th>
                    <th style={{ padding: '0.75rem 1rem' }}>DATE INITIATED</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((proj) => {
                    const runId = proj.latest_run_id || proj.id;
                    const status = proj.latest_run_status || proj.status;
                    const isCompleted = status === 'completed';
                    const isRunning = status === 'running' || status === 'researching';

                    return (
                      <tr
                        key={proj.id}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          transition: 'background 0.2s',
                        }}
                      >
                        <td style={{ padding: '1rem', fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>
                          {proj.topic}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {isCompleted ? (
                            <span className="status-pill completed" style={{ fontSize: '0.75rem' }}>
                              <CheckCircle2 size={12} />
                              COMPLETED
                            </span>
                          ) : isRunning ? (
                            <span className="status-pill running" style={{ fontSize: '0.75rem' }}>
                              <Activity size={12} className="animate-pulse" />
                              RESEARCHING
                            </span>
                          ) : (
                            <span className="status-pill failed" style={{ fontSize: '0.75rem' }}>
                              <AlertCircle size={12} />
                              {status.toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {new Date(proj.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <Link
                            href={`/research/${runId}`}
                            className="btn btn-primary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                          >
                            <span>{isCompleted ? 'View Report' : 'Open Telemetry'}</span>
                            <ArrowRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
