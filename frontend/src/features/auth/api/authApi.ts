import { apiRequest, logoutApi } from '../../../shared/lib/api-client';
import type { SessionUser } from '../../../shared/types/api';
import { authStore } from '../../../shared/lib/auth';

export async function loginWithPassword(email: string, password: string) {
  const data = await apiRequest<{ user: SessionUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  authStore.setSession({ user: data.user });
  return { user: data.user };
}

export async function registerCustomer(payload: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}) {
  const data = await apiRequest<{ user: SessionUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  authStore.setSession({ user: data.user });
  return { user: data.user };
}

export async function logout(): Promise<void> {
  await logoutApi();
}
