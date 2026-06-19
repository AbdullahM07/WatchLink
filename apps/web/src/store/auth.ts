'use client';

import { create } from 'zustand';
import type { PublicUser } from '@watchlink/shared';
import { setToken } from '@/lib/token';

type AuthStatus = 'loading' | 'authenticated' | 'guest';

interface AuthState {
  user: PublicUser | null;
  status: AuthStatus;
  /** Store the session after a successful login/register. */
  login: (token: string, user: PublicUser) => void;
  /** Update the cached user (e.g. after editing the profile). */
  setUser: (user: PublicUser) => void;
  /** Mark auth resolution finished (used by the bootstrapper). */
  resolve: (user: PublicUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',
  login: (token, user) => {
    setToken(token);
    set({ user, status: 'authenticated' });
  },
  setUser: (user) => set({ user }),
  resolve: (user) => set({ user, status: user ? 'authenticated' : 'guest' }),
  logout: () => {
    setToken(null);
    set({ user: null, status: 'guest' });
  },
}));
