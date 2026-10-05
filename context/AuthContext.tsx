'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { UserProfile, UserRole } from '@/lib/supabase/types';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  isLoading: true,
  isAuthenticated: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync or fetch profile from public.users
  const fetchOrSyncProfile = async (currentUser: User) => {
    try {
      const userRole: UserRole =
        (currentUser.user_metadata?.role as UserRole) === 'admin' ? 'admin' : 'researcher';
      const userName =
        currentUser.user_metadata?.name ||
        currentUser.email?.split('@')[0] ||
        'Researcher';

      // 1. Direct upsert into public.users
      try {
        await supabase.from('users').upsert({
          id: currentUser.id,
          email: currentUser.email || '',
          name: userName,
          role: userRole,
        }, { onConflict: 'id' });
      } catch {
        // Continue to server-side sync if client RLS blocks
      }

      // 2. Call server sync endpoint (admin client with service role)
      await fetch('/api/auth/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentUser.id,
          name: userName,
          email: currentUser.email || '',
          role: userRole,
        }),
      }).catch(() => null);

      // 3. Read confirmed profile from public.users
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (data) {
        setProfile(data as UserProfile);
        setRole((data.role as UserRole) || userRole);
      } else {
        const fallbackProfile: UserProfile = {
          id: currentUser.id,
          name: userName,
          email: currentUser.email || '',
          role: userRole,
        };
        setProfile(fallbackProfile);
        setRole(userRole);
      }
    } catch {
      // Fallback to metadata
      const fallbackRole = (currentUser.user_metadata?.role as UserRole) || 'researcher';
      setRole(fallbackRole);
      setProfile({
        id: currentUser.id,
        name: currentUser.user_metadata?.name || 'Researcher',
        email: currentUser.email || '',
        role: fallbackRole,
      });
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchOrSyncProfile(user);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Check initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            await fetchOrSyncProfile(session.user);
          } else {
            setUser(null);
            setProfile(null);
            setRole(null);
          }
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session: Session | null) => {
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          await fetchOrSyncProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
          setRole(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isLoading,
        isAuthenticated: !!user,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
