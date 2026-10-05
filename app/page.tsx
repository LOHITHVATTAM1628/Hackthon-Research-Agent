'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  Sparkles,
  ArrowRight,
  Search,
  BookOpen,
  PenTool,
  CheckCircle,
  Activity,
  GitCompare,
  CopyCheck,
  Bot,
  Database,
  Cpu,
  Globe,
  ShieldCheck,
  ChevronRight,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  const [activeStage, setActiveStage] = useState<number>(0);

  const pipelineStages = [
    {
      num: '01',
      title: 'Search Agent',
      agent: 'Tavily Web Searcher',
      desc: 'Executes semantic queries across authoritative web sources, extracting high-relevance URLs, metadata, and factual snippets in sub-second bursts.',
      color: '#ff8c32',
      tech: 'Tavily API · Groq Llama/Qwen',
    },
    {
      num: '02',
      title: 'Reader Agent',
      agent: 'Deep Content Scraper',
      desc: 'Autonomously selects the most authoritative source from search results, sanitizes HTML, strips telemetry, and synthesizes structured raw facts.',
      color: '#38bdf8',
      tech: 'BeautifulSoup4 · Requests · DOM Decomposer',
    },
    {
      num: '03',
      title: 'Writer Chain',
      agent: 'Synthesis & Structuring Engine',
      desc: 'Aggregates search and deep-scraped content into comprehensive, peer-reviewed research reports complete with executive summaries, findings, and citation links.',
      color: '#10b981',
      tech: 'LangChain LCEL · Markdown Synthesizer',
    },
    {
      num: '04',
      title: 'Critic Chain',
      agent: 'Objective Quality Assessor',
      desc: 'Reviews drafts against rigorous academic and factual rubrics, providing an objective score out of 10, identified strengths, areas to improve, and verdict.',
      color: '#a855f7',
      tech: 'Adversarial Prompting · Quality Rubric',
    },
  ];

  const features = [
    {
      icon: <Activity size={24} color="#ff8c32" />,
      tag: 'Real-Time Insights',
      title: 'Live Pipeline Telemetry',
      desc: 'Observe live agent step progression, token consumption, retrieval latencies, and tool call traces as research unfolds.',
    },
    {
      icon: <GitCompare size={24} color="#38bdf8" />,
      tag: 'Iterative Refinement',
      title: 'Evolution & Re-Research Engine',
      desc: 'Run re-research on existing topics with automatic side-by-side markdown diffing, highlighting newly emerged facts and deprecated claims.',
    },
    {
      icon: <CopyCheck size={24} color="#10b981" />,
      tag: 'Team Synergy',
      title: 'Duplicate Topic Detection',
      desc: 'Automatically flag semantic duplicates before starting runs. Prevent redundant LLM spend and collaborate with teammates on shared findings.',
    },
    {
      icon: <Bot size={24} color="#a855f7" />,
      tag: 'Specialized AI',
      title: 'Dual-Domain Chatbots',
      desc: 'Interact with two dedicated conversational agents: one tuned specifically for report evolution & revisions, and another for open research exploration.',
    },
    {
      icon: <Cpu size={24} color="#f59e0b" />,
      tag: 'Ultra-Fast Compute',
      title: 'Groq LPUs + Tavily Integration',
      desc: 'Harness high-throughput LPUs for lightning-fast token generation paired with deterministic real-time web retrieval.',
    },
    {
      icon: <ShieldCheck size={24} color="#ec4899" />,
      tag: 'Enterprise Security',
      title: 'Role-Based Access Control',
      desc: 'Supabase-powered RBAC distinguishing Researcher workspaces from Admin system panels with Row Level Security guarantees.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* ── HERO SECTION ──────────────────────────────────────────────── */}
        <section
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '5rem 1.5rem 4rem',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Top Announcement Badge */}
          <div style={{ display: 'inline-flex', marginBottom: '1.75rem' }}>
            <div className="badge-pill">
              <Sparkles size={13} />
              <span>Autonomous Multi-Agent Pipeline · Groq & Tavily</span>
            </div>
          </div>

          {/* Main Hero Headline */}
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 6.5vw, 4.75rem)',
              fontWeight: 800,
              lineHeight: 1.05,
              maxWidth: '960px',
              margin: '0 auto 1.5rem',
              color: '#f8fafc',
            }}
          >
            Accelerate Research From Raw Inquiries to{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #ffaa40 0%, #ff521a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Ground-Truth Synthesis
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 'clamp(1.05rem, 2vw, 1.35rem)',
              color: 'var(--text-secondary)',
              maxWidth: '780px',
              margin: '0 auto 2.5rem',
              lineHeight: 1.6,
            }}
          >
            An autonomous multi-agent research pipeline driven by Groq inference,
            Tavily live web scraping, and Supabase RBAC. From discovery to critic-scored reports in seconds.
          </p>

          {/* Action CTAs */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '4.5rem',
            }}
          >
            <Link href="/signup" className="btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
              <span>Start Researching Free</span>
              <ArrowRight size={18} />
            </Link>

            <Link href="/login" className="btn-secondary" style={{ padding: '0.9rem 1.8rem', fontSize: '1.05rem' }}>
              <span>Sign In to Workspace</span>
            </Link>

            <a href="#architecture" className="btn-ghost" style={{ padding: '0.9rem 1.2rem', fontSize: '0.95rem' }}>
              <span>Explore Architecture ↓</span>
            </a>
          </div>

          {/* Metric Stats Banner */}
          <div
            className="glass-card"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '2rem',
              padding: '2rem 2.5rem',
              maxWidth: '1040px',
              margin: '0 auto',
              textAlign: 'left',
            }}
          >
            <div>
              <div
                className="mono-text"
                style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--accent-orange)' }}
              >
                &lt; 1.2s
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                Groq Token Generation
              </div>
            </div>

            <div>
              <div
                className="mono-text"
                style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}
              >
                4 Stages
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                Autonomous Agent Loop
              </div>
            </div>

            <div>
              <div
                className="mono-text"
                style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--accent-emerald)' }}
              >
                100%
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                Live Source Attribution
              </div>
            </div>

            <div>
              <div
                className="mono-text"
                style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--accent-violet)' }}
              >
                RBAC
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                Researcher vs Admin Access
              </div>
            </div>
          </div>
        </section>

        {/* ── 4-STAGE PIPELINE SHOWCASE ─────────────────────────────────── */}
        <section
          id="pipeline"
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '5rem 1.5rem',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="badge-pill cyan" style={{ marginBottom: '1rem' }}>
              Execution Lifecycle
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#fff', marginBottom: '1rem' }}>
              The Autonomous 4-Stage Research Pipeline
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto' }}>
              Each stage is powered by specialized agents equipped with dedicated tools and verification prompts.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {pipelineStages.map((stage, idx) => (
              <div
                key={stage.num}
                onClick={() => setActiveStage(idx)}
                className="glass-card"
                style={{
                  cursor: 'pointer',
                  borderColor: activeStage === idx ? stage.color : 'var(--border-subtle)',
                  boxShadow: activeStage === idx ? `0 0 30px ${stage.color}25` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <span
                      className="mono-text"
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: stage.color,
                        background: `${stage.color}15`,
                        padding: '0.3rem 0.6rem',
                        borderRadius: '6px',
                        border: `1px solid ${stage.color}40`,
                      }}
                    >
                      STAGE {stage.num}
                    </span>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: stage.color,
                      }}
                    />
                  </div>

                  <h3 style={{ fontSize: '1.35rem', marginBottom: '0.4rem', color: '#fff' }}>
                    {stage.title}
                  </h3>
                  <div
                    className="mono-text"
                    style={{ fontSize: '0.8rem', color: stage.color, marginBottom: '0.85rem' }}
                  >
                    {stage.agent}
                  </div>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {stage.desc}
                  </p>
                </div>

                <div
                  className="mono-text"
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '1rem',
                    marginTop: '1.25rem',
                  }}
                >
                  ⚡ {stage.tech}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── ARCHITECTURE SHOWCASE ─────────────────────────────────────── */}
        <section
          id="architecture"
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '4rem 1.5rem 6rem',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="badge-pill emerald" style={{ marginBottom: '1rem' }}>
              System Flow
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#fff', marginBottom: '1rem' }}>
              Under the Hood Architecture
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto' }}>
              End-to-end data pipeline from user prompt to structured database persistence.
            </p>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '3rem 2rem',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Visual Flow diagram */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1.25rem',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {/* Node 1 */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '1.4rem 1rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: 'var(--accent-orange)', marginBottom: '0.5rem' }}>
                  <Search size={28} style={{ margin: '0 auto' }} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>User Query</div>
                <div className="mono-text" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Researcher Input
                </div>
              </div>

              {/* Node 2 */}
              <div
                style={{
                  background: 'rgba(255,140,50,0.06)',
                  border: '1px solid var(--border-accent)',
                  borderRadius: '12px',
                  padding: '1.4rem 1rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: 'var(--accent-orange)', marginBottom: '0.5rem' }}>
                  <Globe size={28} style={{ margin: '0 auto' }} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>Tavily Search</div>
                <div className="mono-text" style={{ fontSize: '0.72rem', color: 'var(--accent-orange)', marginTop: '4px' }}>
                  Live Web Retrieval
                </div>
              </div>

              {/* Node 3 */}
              <div
                style={{
                  background: 'rgba(56,189,248,0.06)',
                  border: '1px solid rgba(56,189,248,0.3)',
                  borderRadius: '12px',
                  padding: '1.4rem 1rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
                  <BookOpen size={28} style={{ margin: '0 auto' }} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>Reader Agent</div>
                <div className="mono-text" style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                  Deep Page Scrape
                </div>
              </div>

              {/* Node 4 */}
              <div
                style={{
                  background: 'rgba(16,185,129,0.06)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: '12px',
                  padding: '1.4rem 1rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>
                  <PenTool size={28} style={{ margin: '0 auto' }} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>Writer Chain</div>
                <div className="mono-text" style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
                  Groq Synthesizer
                </div>
              </div>

              {/* Node 5 */}
              <div
                style={{
                  background: 'rgba(168,85,247,0.06)',
                  border: '1px solid rgba(168,85,247,0.3)',
                  borderRadius: '12px',
                  padding: '1.4rem 1rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: 'var(--accent-violet)', marginBottom: '0.5rem' }}>
                  <CheckCircle size={28} style={{ margin: '0 auto' }} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>Critic Chain</div>
                <div className="mono-text" style={{ fontSize: '0.72rem', color: 'var(--accent-violet)', marginTop: '4px' }}>
                  Scoring Rubric
                </div>
              </div>

              {/* Node 6 */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  padding: '1.4rem 1rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: '#fff', marginBottom: '0.5rem' }}>
                  <Database size={28} style={{ margin: '0 auto' }} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>Supabase</div>
                <div className="mono-text" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Storage & RBAC
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── INTERACTIVE FEATURES SECTION ──────────────────────────────── */}
        <section
          id="features"
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '2rem 1.5rem 6rem',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="badge-pill" style={{ marginBottom: '1rem' }}>
              Key Capabilities
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#fff', marginBottom: '1rem' }}>
              Engineered for Serious Research
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto' }}>
              Features designed to ensure factual accuracy, prevent duplication, and facilitate team collaboration.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {features.map((feat) => (
              <div key={feat.title} className="glass-card">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {feat.icon}
                  </div>
                  <span
                    className="mono-text"
                    style={{
                      fontSize: '0.72rem',
                      letterSpacing: '0.08em',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {feat.tag}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.6rem', color: '#fff' }}>
                  {feat.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.6 }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── ROLE-BASED ACCESS CONTROL (RBAC) SECTION ─────────────────── */}
        <section
          id="roles"
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '2rem 1.5rem 6rem',
          }}
        >
          <div className="glass-card" style={{ padding: '3.5rem 2.5rem', textAlign: 'center' }}>
            <div className="badge-pill cyan" style={{ marginBottom: '1.2rem' }}>
              Security & Permissions
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)', color: '#fff', marginBottom: '1.25rem' }}>
              Built-In Role-Based Access Control
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                maxWidth: '680px',
                margin: '0 auto 3rem',
                lineHeight: 1.6,
              }}
            >
              Tailored experiences with cryptographically verified sessions and Supabase Row Level Security.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                textAlign: 'left',
              }}
            >
              {/* Researcher Card */}
              <div
                style={{
                  background: 'rgba(255, 140, 50, 0.04)',
                  border: '1px solid rgba(255, 140, 50, 0.25)',
                  borderRadius: '14px',
                  padding: '2rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span
                    className="badge-pill"
                    style={{ fontSize: '0.7rem' }}
                  >
                    Researcher Role
                  </span>
                </div>
                <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.75rem' }}>
                  Researcher Workspace
                </h3>
                <ul
                  style={{
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.92rem',
                  }}
                >
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={16} color="var(--accent-orange)" />
                    Execute autonomous 4-stage research runs
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={16} color="var(--accent-orange)" />
                    Access interactive Re-Research & Diffing engine
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={16} color="var(--accent-orange)" />
                    Engage with Report Evolution & General chatbots
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={16} color="var(--accent-orange)" />
                    Export peer-reviewed markdown reports
                  </li>
                </ul>
              </div>

              {/* Admin Card */}
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.04)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '14px',
                  padding: '2rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span
                    className="badge-pill cyan"
                    style={{ fontSize: '0.7rem' }}
                  >
                    Admin Role
                  </span>
                </div>
                <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.75rem' }}>
                  System Operations Panel
                </h3>
                <ul
                  style={{
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.92rem',
                  }}
                >
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={16} color="var(--accent-cyan)" />
                    System-wide execution telemetry & latency monitoring
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={16} color="var(--accent-cyan)" />
                    Inspect full agent reasoning chains & tool traces
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={16} color="var(--accent-cyan)" />
                    Manage registered researchers & role permissions
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={16} color="var(--accent-cyan)" />
                    Monitor API quota consumption & token usage
                  </li>
                </ul>
              </div>
            </div>

            <div style={{ marginTop: '2.5rem' }}>
              <Link href="/signup" className="btn-primary" style={{ padding: '0.85rem 2.2rem' }}>
                Create Your Account Now
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(7, 7, 12, 0.95)',
          padding: '3rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
              Research<span style={{ color: 'var(--accent-orange)' }}>Mind</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Next-Generation Multi-Agent Research System · Phase 1 Production Foundation
            </div>
          </div>

          <div className="mono-text" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Stack: Next.js 14 · Supabase SSR · Groq LPUs · Tavily Web Search
          </div>
        </div>
      </footer>
    </div>
  );
}
