import { env } from '../config/env';
import { authStore } from './auth';
import type { ApiEnvelope } from '../types/api';
import type { SessionUser } from '../types/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

type RequestOptions = RequestInit & {
  auth?: boolean;
};

function buildUrl(path: string): string {
  const base = env.apiBaseUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

async function tryRefreshSession(): Promise<boolean> {
  const res = await fetch(buildUrl('/auth/refresh'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    return false;
  }
  const json = (await res.json().catch(() => null)) as ApiEnvelope<{
    user: SessionUser;
    refreshed?: boolean;
  }> | null;
  const user = json?.data?.user;
  if (user) {
    authStore.setSession({ user });
    return true;
  }
  return false;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions & { __retry?: boolean } = {},
): Promise<T> {
  const headers = new Headers(options.headers ?? {});

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth && !authStore.getSession()?.user) {
    throw new ApiError('Login is required for this screen.');
  }

  const { __retry, ...fetchInit } = options;

  const response = await fetch(buildUrl(path), {
    ...fetchInit,
    credentials: 'include',
    headers,
  });

  if (
    response.status === 401 &&
    !__retry &&
    !path.startsWith('/auth/login') &&
    !path.startsWith('/auth/register') &&
    !path.startsWith('/auth/refresh')
  ) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, __retry: true });
    }
  }

  const responseText = await response.text();
  let body: any = null;
  try {
    body = JSON.parse(responseText);
  } catch (e) {
    // Not JSON
  }

  if (!response.ok) {
    const rawMessage = body && 'message' in body ? body.message : 'Request failed';
    const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage ?? `Server error (${response.status})`;
    throw new ApiError(message, response.status);
  }

  if (!body || !('data' in body)) {
    throw new ApiError('Invalid response format from server');
  }

  return body.data;
}

export async function downloadWithAuth(path: string) {
  if (!authStore.getSession()?.user) {
    throw new ApiError('Login is required for this download.');
  }

  const response = await fetch(buildUrl(path), {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new ApiError('Unable to export report.', response.status);
  }

  return {
    blob: await response.blob(),
    contentDisposition: response.headers.get('content-disposition'),
  };
}

export async function logoutApi(): Promise<void> {
  await fetch(buildUrl('/auth/logout'), {
    method: 'POST',
    credentials: 'include',
  }).catch(() => undefined);
  authStore.clear();
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => 
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: any, options?: RequestOptions) => 
    apiRequest<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: any, options?: RequestOptions) => 
    apiRequest<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string, options?: RequestOptions) => 
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
