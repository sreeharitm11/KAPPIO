import type { AuthSession, UserRole } from '../types/api';

const STORAGE_KEY = 'kappio.user';

/** Persisted user snapshot (tokens live in httpOnly cookies). */
export const authStore = {
  getSession(): AuthSession | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const value = window.sessionStorage.getItem(STORAGE_KEY);
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as AuthSession;
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
  },
  setSession(session: AuthSession) {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  },
  clear() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  },
  /** @deprecated Cookies carry JWT; use session + credentials instead */
  getToken(): string | null {
    return null;
  },
  getRole(): UserRole | null {
    return authStore.getSession()?.user.role ?? null;
  },
};
