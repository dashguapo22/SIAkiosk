import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, UserProfile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  displayName: string;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const pushDebug = (label: string, details: Record<string, unknown> = {}) => {
    const detailText = Object.entries(details)
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(' ');
    const line = `${new Date().toLocaleTimeString()} ${label}${detailText ? ` ${detailText}` : ''}`;
    console.log('[auth-debug]', line);
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
        const [nextRoles, nextProfile] = await Promise.all([
          fetchUserRoles(nextSession.user.id),
          fetchUserProfile(nextSession.user.id),
        ]);
        if (!isMounted) return;
        setRoles(nextRoles);
        setProfile(nextProfile);
        setIsRolesLoading(false);
        pushDebug('rolesLoaded', {
          path: window.location.pathname,
          userId: nextSession.user.id,
          roles: nextRoles,
          profileName: nextProfile?.full_name ?? null,
        });
      } else {
        setRoles([]);
        setProfile(null);
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

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error) {
      return (data as UserProfile | null) ?? null;
    }

    pushDebug('profileError', {
      path: window.location.pathname,
      userId,
      error: error.message,
    });
    return null;
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
    setProfile(null);
    setIsRolesLoading(false);
  };

  const isAdmin = roles.includes('admin');
  const isCashier = roles.includes('cashier') || isAdmin;
  const displayName =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Cashier';

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      displayName,
      isLoading,
      isRolesLoading,
      isAdmin,
      isCashier,
      signIn,
      signUp,
      signOut,
    }}>
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
