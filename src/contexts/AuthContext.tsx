'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Unified user type that works with NextAuth
export interface AppUser {
  id: string;
  email: string;
  user_metadata: {
    role?: string;
    org_id?: string | null;
    team_id?: string | null;
    auth_type?: 'nextauth' | 'legacy';
    full_name?: string;
    [key: string]: any;
  };
  // NextAuth fields
  name?: string;
  role?: string;
  org_id?: string | null;
  team_id?: string | null;
  permissions?: string[];
  organization?: any;
  team?: any;
}

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: AppUser | null }>;
  signUp: (email: string, password: string, metadata?: { [key: string]: any }) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { name?: string; [key: string]: any }) => Promise<void>;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Convert NextAuth session to AppUser format for backward compatibility
  useEffect(() => {
    if (status === 'loading') {
      return; // Still loading
    }

    if (session?.user) {
      const nextAuthUser = session.user;
      const appUser: AppUser = {
        id: nextAuthUser.id,
        email: nextAuthUser.email || '',
        name: nextAuthUser.name || undefined,
        role: nextAuthUser.role,
        org_id: nextAuthUser.org_id,
        team_id: nextAuthUser.team_id,
        permissions: nextAuthUser.permissions,
        organization: nextAuthUser.organization,
        team: nextAuthUser.team,
        user_metadata: {
          role: nextAuthUser.role,
          org_id: nextAuthUser.org_id,
          team_id: nextAuthUser.team_id,
          auth_type: 'nextauth',
          full_name: nextAuthUser.name || undefined
        }
      };
      setUser(appUser);
    } else {
      setUser(null);
    }
  }, [session, status]);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      console.log('AuthContext: Attempting sign in via API...');
      
      // Use your enhanced API route that handles both auth systems
      const response = await fetch('/api/auth/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Important for cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const { user: userData } = await response.json();
      console.log('AuthContext: Sign in successful, user:', userData);
      console.log('AuthContext: Auth type:', userData.authType);
      
      // Create a user object compatible with your existing code
      const user = {
        id: userData.id,
        email: userData.email,
        user_metadata: {
          role: userData.role,
          org_id: userData.org_id,
          team_id: userData.team_id,
          auth_type: userData.authType
        }
      };
      
      setUser(user as AppUser);
      return { user: user as AppUser };
    } catch (error) {
      console.error('AuthContext: Sign in error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during sign in');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, metadata?: { [key: string]: any }) => {
    try {
      setError(null);
      // TODO: Implement sign up via API or redirect to sign up page
      console.log('Sign up requested:', { email, metadata });
      throw new Error('Sign up not implemented yet');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during sign up');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await nextAuthSignOut({ redirect: false });
      setUser(null);
      router.push('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during sign out');
      throw error;
    }
  };

  const updateProfile = async (updates: { name?: string; [key: string]: any }) => {
    try {
      setError(null);
      
      // Update profile via API
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      // Update local user state immediately for better UX
      if (user && updates.name) {
        setUser({
          ...user,
          name: updates.name,
          user_metadata: {
            ...user.user_metadata,
            full_name: updates.name,
            name: updates.name
          }
        });
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during profile update');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading: status === 'loading', 
      signIn, 
      signUp, 
      signOut, 
      updateProfile, 
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 