import { env } from '../config/env';
import { authStore } from './auth';
import type { SessionUser } from '../types/api';

/** Restore session from httpOnly cookie via GET /auth/me */
export async function hydrateSessionFromCookies(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const apiRoot = env.apiBaseUrl.startsWith('http')
    ? env.apiBaseUrl.replace(/\/$/, '')
    : `${window.location.origin}${env.apiBaseUrl}`;

  try {
    const res = await fetch(`${apiRoot}/auth/me`, {
      credentials: 'include',
    });
    if (!res.ok) {
      authStore.clear();
      return;
    }
    const json = (await res.json()) as { data: SessionUser };
    authStore.setSession({ user: json.data });
  } catch {
    authStore.clear();
  }
}
