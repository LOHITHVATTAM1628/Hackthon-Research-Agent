'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { UserRole } from '@/lib/supabase/types';
import {
  Sparkles,
  ArrowRight,
  Shield,
  User,
  Lock,
  Mail,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('researcher');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please provide your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            role,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // 2. Ensure user record exists in public.users via direct upsert
        try {
          await supabase.from('users').upsert({
            id: data.user.id,
            email: data.user.email || email.trim(),
            name: name.trim() || data.user.email?.split('@')[0],
            role,
          }, { onConflict: 'id' });
        } catch {
          // ignore if client RLS blocks
        }

        // 3. Sync into public.users table via API route (service role admin client)
        await fetch('/api/auth/sync-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: data.user.id,
            name: name.trim(),
            email: email.trim(),
            role,
          }),
        }).catch((err) => console.warn('Background sync note:', err));

        success(`Account created successfully as ${role.toUpperCase()}!`);

        // Check if session was immediately established or email confirmation is required
        if (data.session) {
          const destination = role === 'admin' ? '/admin' : '/dashboard';
          router.push(destination);
        } else {
          // If Supabase has email confirmation enabled
          success('Confirmation link sent! Please check your inbox.');
          router.push('/login?registered=1');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem 1.5rem',
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem',
            textDecoration: 'none',
            color: 'inherit',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
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
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.45rem',
              fontWeight: 800,
            }}
          >
            Research<span style={{ color: 'var(--accent-orange)' }}>Mind</span>
          </span>
        </Link>
        <h1 style={{ fontSize: '1.85rem', color: '#fff', marginBottom: '0.35rem' }}>
          Create Your Account
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Choose your role to access specialized research tools
        </p>
      </div>

      {/* Main Form Card */}
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '2.5rem 2rem',
        }}
      >
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              color: '#fca5a5',
              fontSize: '0.88rem',
              marginBottom: '1.5rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Full Name */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.45rem',
              }}
            >
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                className="input-field"
                placeholder="Dr. Samantha Vance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.45rem',
              }}
            >
              Work / University Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="email"
                className="input-field"
                placeholder="name@institution.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.45rem',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="password"
                className="input-field"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
                required
              />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Must be at least 6 characters
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.65rem',
              }}
            >
              Select Your System Role
            </label>
            <div style={{ display: 'flex', gap: '0.85rem' }}>
              {/* Researcher Option */}
              <div
                className={`role-card ${role === 'researcher' ? 'selected' : ''}`}
                onClick={() => setRole('researcher')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-orange)' }}>
                    <User size={18} />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Researcher</span>
                  </div>
                  {role === 'researcher' && <CheckCircle2 size={16} color="var(--accent-orange)" />}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Launch research runs, explore evolution diffs, and use specialized chatbots.
                </p>
              </div>

              {/* Admin Option */}
              <div
                className={`role-card ${role === 'admin' ? 'selected' : ''}`}
                onClick={() => setRole('admin')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-cyan)' }}>
                    <Shield size={18} />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Admin</span>
                  </div>
                  {role === 'admin' && <CheckCircle2 size={16} color="var(--accent-cyan)" />}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Inspect system telemetry, live token metrics, logs, and user permissions.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '0.9rem',
              fontSize: '1rem',
              marginTop: '0.5rem',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="pulse-node" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Registering Account…</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Bottom Switch to Login */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
          }}
        >
          Already have an account?{' '}
          <Link
            href="/login"
            style={{
              color: 'var(--accent-orange)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Log in here →
          </Link>
        </div>
      </div>
    </div>
  );
}
