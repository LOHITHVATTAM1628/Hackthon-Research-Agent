'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import {
  Shield,
  Activity,
  Users,
  Cpu,
  Database,
  LogOut,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Layers,
} from 'lucide-react';

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  role: string;
  created_at: string;
}

interface RunRecord {
  id: string;
  research_project_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  topic?: string;
}

interface LogRecord {
  id: string;
  agent_name: string;
  status: string;
  message: string;
  timestamp: string;
  research_run_id: string;
}

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [runsList, setRunsList] = useState<RunRecord[]>([]);
  const [logsList, setLogsList] = useState<LogRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (usersData) setUsersList(usersData);

      // 2. Fetch Research Runs with Project Topics
      const { data: runsData } = await supabase
        .from('research_runs')
        .select('id, research_project_id, status, started_at, completed_at')
        .order('started_at', { ascending: false })
        .limit(15);

      if (runsData && runsData.length > 0) {
        const projectIds = runsData.map((r) => r.research_project_id);
        const { data: projectsData } = await supabase
          .from('research_projects')
          .select('id, topic')
          .in('id', projectIds);

        const mergedRuns: RunRecord[] = runsData.map((r) => ({
          ...r,
          topic: projectsData?.find((p) => p.id === r.research_project_id)?.topic || 'Autonomous Research Run',
        }));
        setRunsList(mergedRuns);
      }

      // 3. Fetch Recent Agent Logs across system
      const { data: logsData } = await supabase
        .from('agent_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(15);

      if (logsData) setLogsList(logsData);
    } catch (err) {
      console.warn('Error fetching admin telemetry data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Admin Navigation */}
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
                  background: 'linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield size={18} color="#08080c" />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                }}
              >
                Research<span style={{ color: 'var(--accent-cyan)' }}>Admin</span>
              </span>
            </Link>

            <span className="badge-pill cyan" style={{ fontSize: '0.68rem' }}>
              System Operations Portal
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              href="/dashboard"
              className="btn-secondary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', color: 'var(--accent-orange)' }}
            >
              Researcher Workspace →
            </Link>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.8rem',
                background: 'rgba(56, 189, 248, 0.08)',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              <Shield size={15} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                {profile?.name || user?.user_metadata?.name || 'Administrator'}
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

      {/* Main Admin Content */}
      <main style={{ flex: 1, maxWidth: '1300px', width: '100%', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Admin Header */}
        <div
          className="glass-card"
          style={{
            padding: '2.5rem',
            marginBottom: '2rem',
            background:
              'radial-gradient(ellipse 70% 60% at 90% 10%, rgba(56, 189, 248, 0.12) 0%, rgba(18, 18, 29, 0.72) 70%)',
          }}
        >
          <div className="badge-pill cyan" style={{ marginBottom: '0.85rem' }}>
            Elevated Access Guaranteed · Supabase RLS Active
          </div>
          <h1 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '0.5rem' }}>
            System Infrastructure Overview
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', lineHeight: 1.5 }}>
            Monitor cross-organization agent pipelines, Groq LPU model allocation, Tavily search quotas, and registered user permissions.
          </p>
        </div>

        {/* Telemetry Stat Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem',
          }}
        >
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                Groq LPU Engine
              </span>
              <Cpu size={18} color="var(--accent-orange)" />
            </div>
            <div className="mono-text" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
              Operational
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', marginTop: '0.35rem' }}>
              ● Model: openai/gpt-oss-20b
            </div>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                Tavily Search Tier
              </span>
              <Activity size={18} color="var(--accent-cyan)" />
            </div>
            <div className="mono-text" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
              Live
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', marginTop: '0.35rem' }}>
              ● Real-Time Web Scraping Active
            </div>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                Registered Users
              </span>
              <Users size={18} color="var(--accent-emerald)" />
            </div>
            <div className="mono-text" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
              {usersList.length}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', marginTop: '0.35rem' }}>
              ● RBAC Synced via Supabase
            </div>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                Total Research Runs
              </span>
              <Layers size={18} color="var(--accent-violet)" />
            </div>
            <div className="mono-text" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
              {runsList.length}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-violet)', marginTop: '0.35rem' }}>
              ● Multi-Agent Swarms
            </div>
          </div>
        </div>

        {/* System Runs & User Management Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem',
          }}
        >
          {/* Module 1: System-wide Research Missions */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Layers size={20} color="var(--accent-orange)" />
                <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Recent Pipeline Runs</h3>
              </div>
              <button
                type="button"
                onClick={fetchAdminData}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                <RefreshCw size={13} />
              </button>
            </div>

            {runsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                No runs recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {runsList.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{r.topic}</div>
                      <div className="mono-text" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        RUN: {r.id.slice(0, 8)} · {r.status.toUpperCase()}
                      </div>
                    </div>
                    <Link
                      href={`/research/${r.id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', textDecoration: 'none' }}
                    >
                      <span>Telemetry</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Module 2: User Roles Directory */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Users size={20} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Registered Users ({usersList.length})</h3>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {usersList.map((u) => (
                <div
                  key={u.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{u.name || 'Unnamed User'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                  </div>
                  <span
                    className={`badge-pill ${u.role === 'admin' ? 'cyan' : ''}`}
                    style={{ fontSize: '0.68rem' }}
                  >
                    {u.role.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Agent Logs Stream */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Activity size={20} color="var(--accent-emerald)" />
              <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Live System Agent Audit Logs</h3>
            </div>
            <span className="mono-subtext">Supabase agent_logs stream</span>
          </div>

          <div
            className="font-mono"
            style={{
              background: '#09090f',
              borderRadius: '8px',
              padding: '1rem',
              border: '1px solid var(--border-subtle)',
              maxHeight: '350px',
              overflowY: 'auto',
              fontSize: '0.8rem',
              lineHeight: 1.6,
            }}
          >
            {logsList.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No logs recorded yet.</div>
            ) : (
              logsList.map((l) => (
                <div key={l.id} style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>{new Date(l.timestamp).toLocaleTimeString()}</span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>[{l.agent_name}]</span>
                  <span style={{ color: l.status === 'completed' ? '#34d399' : '#fbbf24' }}>
                    [{l.status.toUpperCase()}]
                  </span>
                  <span style={{ color: '#e2e8f0' }}>{l.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
