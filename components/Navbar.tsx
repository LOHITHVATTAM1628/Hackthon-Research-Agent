'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Shield, User, LogOut, Menu, X, ArrowRight } from 'lucide-react';
import { NotificationBell } from './collaboration/NotificationBell';

export default function Navbar() {
  const { user, role, signOut, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const destination = role === 'admin' ? '/admin' : '/dashboard';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(7, 7, 12, 0.75)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
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
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ff8c32 0%, #ff521a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 140, 50, 0.4)',
            }}
          >
            <Sparkles size={20} color="#08080c" />
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              Research<span style={{ color: 'var(--accent-orange)' }}>Mind</span>
            </div>
            <div
              className="mono-text"
              style={{
                fontSize: '0.62rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginTop: '2px',
              }}
            >
              Multi-Agent Engine
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'none',
            gap: '1.75rem',
            alignItems: 'center',
          }}
          className="desktop-nav"
        >
          <Link href="/dashboard" className="btn-ghost">
            Dashboard
          </Link>
          <Link href="/collaborations" className="btn-ghost">
            Collaborations
          </Link>
          <Link href="/profile" className="btn-ghost">
            History
          </Link>
          <Link href="/chat" className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Sparkles size={13} color="var(--accent-orange)" />
            <span>AI Chat</span>
          </Link>
          <a href="/#features" className="btn-ghost">
            Features
          </a>
          <a href="/#pipeline" className="btn-ghost">
            Pipeline
          </a>
        </nav>

        {/* Desktop Actions */}
        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '0.9rem',
          }}
          className="desktop-actions"
        >
          {/* Real-time Notification Bell */}
          <NotificationBell />

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link
                href={destination}
                className="btn-secondary"
                style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem' }}
              >
                {role === 'admin' ? (
                  <>
                    <Shield size={16} color="var(--accent-cyan)" />
                    Admin Panel
                  </>
                ) : (
                  <>
                    <User size={16} color="var(--accent-orange)" />
                    Researcher Workspace
                  </>
                )}
                <ArrowRight size={14} />
              </Link>

              <button
                onClick={() => signOut()}
                className="btn-ghost"
                title="Sign Out"
                style={{ padding: '0.5rem' }}
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Log In
              </Link>
              <Link href="/signup" className="btn-primary" style={{ padding: '0.6rem 1.3rem', fontSize: '0.88rem' }}>
                Get Started
                <ArrowRight size={15} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-toggle"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '0.4rem',
            display: 'none',
          }}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          style={{
            padding: '1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <Link
            href="/dashboard"
            className="btn-ghost"
            onClick={() => setMobileMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/collaborations"
            className="btn-ghost"
            onClick={() => setMobileMenuOpen(false)}
          >
            Collaborations
          </Link>
          <Link
            href="/profile"
            className="btn-ghost"
            onClick={() => setMobileMenuOpen(false)}
          >
            History & Profile
          </Link>
          <Link
            href="/chat"
            className="btn-ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Sparkles size={14} color="var(--accent-orange)" />
            <span>AI Research Chat</span>
          </Link>
          <a
            href="/#features"
            className="btn-ghost"
            onClick={() => setMobileMenuOpen(false)}
          >
            Features
          </a>
          <a
            href="/#pipeline"
            className="btn-ghost"
            onClick={() => setMobileMenuOpen(false)}
          >
            4-Stage Pipeline
          </a>
          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.5rem 0' }} />
          {isAuthenticated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link
                href={destination}
                className="btn-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Go to {role === 'admin' ? 'Admin Panel' : 'Researcher Workspace'}
              </Link>
              <button
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="btn-secondary"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link
                href="/login"
                className="btn-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="btn-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .desktop-actions {
            display: flex !important;
          }
        }
        @media (max-width: 767px) {
          .mobile-toggle {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
}
