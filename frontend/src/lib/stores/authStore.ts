import { writable } from 'svelte/store';
import { getMeApi } from '$services/api';
import type { Profile } from '$types';

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string | null;
  role?: string;
}

interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isAdmin: false,
  });

  async function fetchProfile(userId?: string): Promise<Profile | null> {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('portal_auth_token');
    if (!token) return null;

    try {
      const res = await getMeApi(token);
      if (res.success && res.data) {
        return res.data.profile;
      }
      return null;
    } catch (e) {
      console.error('Error fetching profile:', e);
      return null;
    }
  }

  async function init() {
    if (typeof window === 'undefined') {
      set({ user: null, profile: null, loading: false, isAdmin: false });
      return;
    }

    const token = localStorage.getItem('portal_auth_token');
    if (!token) {
      set({ user: null, profile: null, loading: false, isAdmin: false });
      return;
    }

    try {
      const res = await getMeApi(token);
      if (res.success && res.data) {
        const { user, profile } = res.data;
        const isAdmin = profile?.role === 'admin' || user?.role === 'admin';
        set({
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
          },
          profile,
          loading: false,
          isAdmin,
        });
      } else {
        localStorage.removeItem('portal_auth_token');
        set({ user: null, profile: null, loading: false, isAdmin: false });
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      set({ user: null, profile: null, loading: false, isAdmin: false });
    }
  }

  function setSession(token: string, user: AuthUser, profile: Profile) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('portal_auth_token', token);
    }
    const isAdmin = profile?.role === 'admin' || user?.role === 'admin';
    set({
      user,
      profile,
      loading: false,
      isAdmin,
    });
  }

  async function signOut() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('portal_auth_token');
    }
    set({ user: null, profile: null, loading: false, isAdmin: false });
  }

  return {
    subscribe,
    init,
    setSession,
    signOut,
    fetchProfile,
  };
}

export const auth = createAuthStore();
