import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isRolesLoading: boolean;
  isAdmin: boolean;
  isCashier: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [debugLines, setDebugLines] = useState<string[]>([]);
  const pushDebug = (label: string, details: Record<string, unknown> = {}) => {
    const detailText = Object.entries(details)
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(' ');
    const line = `${new Date().toLocaleTimeString()} ${label}${detailText ? ` ${detailText}` : ''}`;
    console.log('[auth-debug]', line);
    setDebugLines((prev) => [...prev.slice(-7), line]);
  };

  useEffect(() => {
    let isMounted = true;

    const applyAuthState = async (nextSession: Session | null) => {
      if (!isMounted) return;

      pushDebug('applyAuthState', {
        path: window.location.pathname,
        hasSession: !!nextSession,
        userId: nextSession?.user?.id ?? null,
        expiresAt: nextSession?.expires_at ?? null,
      });

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);

      if (nextSession?.user) {
        setIsRolesLoading(true);
        const nextRoles = await fetchUserRoles(nextSession.user.id);
        if (!isMounted) return;
        setRoles(nextRoles);
        setIsRolesLoading(false);
        pushDebug('rolesLoaded', {
          path: window.location.pathname,
          userId: nextSession.user.id,
          roles: nextRoles,
        });
      } else {
        setRoles([]);
        setIsRolesLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        pushDebug('onAuthStateChange', {
          event,
          path: window.location.pathname,
          hasSession: !!nextSession,
          userId: nextSession?.user?.id ?? null,
          expiresAt: nextSession?.expires_at ?? null,
        });
        void applyAuthState(nextSession);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserRoles = async (userId: string): Promise<AppRole[]> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (!error && data) {
      return data.map(r => r.role as AppRole);
    }

    pushDebug('rolesError', {
      path: window.location.pathname,
      userId,
      error: error?.message ?? 'unknown',
    });
    return [];
  };

  const signIn = async (email: string, password: string) => {
    pushDebug('signIn:start', {
      path: window.location.pathname,
    });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    pushDebug('signIn:result', {
      path: window.location.pathname,
      error: error?.message ?? null,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });

    if (!error && data.user) {
      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        full_name: fullName,
      });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return { error: profileError as Error };
      }

      // Note: No automatic role assignment - admin must approve users
    }

    return { error: error as Error | null };
  };

  const signOut = async () => {
    pushDebug('signOut:start', {
      path: window.location.pathname,
      userId: user?.id ?? null,
    });
    await supabase.auth.signOut();
    setRoles([]);
    setIsRolesLoading(false);
  };

  const isAdmin = roles.includes('admin');
  const isCashier = roles.includes('cashier') || isAdmin;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      isRolesLoading,
      isAdmin,
      isCashier,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
      <div
        style={{
          position: 'fixed',
          left: 8,
          bottom: 8,
          zIndex: 99999,
          maxWidth: 'calc(100vw - 16px)',
          padding: '8px 10px',
          background: 'rgba(0,0,0,0.82)',
          color: '#fff',
          fontSize: '10px',
          lineHeight: 1.4,
          fontFamily: 'monospace',
          borderRadius: 8,
          pointerEvents: 'none',
          whiteSpace: 'pre-wrap',
        }}
      >
        {[
          `path=${typeof window !== 'undefined' ? window.location.pathname : ''}`,
          `user=${user?.id ?? 'null'} session=${session ? 'yes' : 'no'} loading=${String(isLoading)} rolesLoading=${String(isRolesLoading)}`,
          `roles=${roles.join(',') || 'none'}`,
          ...debugLines,
        ].join('\n')}
      </div>
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
