import { apiRequest } from '../../../shared/lib/api-client';
import type { Category, MenuItem, PaginatedResponse } from '../../../shared/types/api';

export function fetchCategories() {
  return apiRequest<Category[]>('/categories');
}

export function fetchMenu(params?: {
  search?: string;
  categoryName?: string;
  availableOnly?: boolean;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.categoryName && params.categoryName !== 'All') query.set('categoryName', params.categoryName);
  if (params?.availableOnly) query.set('availableOnly', 'true');
  query.set('page', String(params?.page ?? 1));
  query.set('limit', String(params?.limit ?? 50));

  return apiRequest<PaginatedResponse<MenuItem>>(`/menu?${query.toString()}`);
}

export function toggleMenuItemAvailability(id: string) {
  return apiRequest<MenuItem>(`/menu/${id}/toggle-availability`, {
    method: 'PATCH',
    auth: true,
  });
}

export function createCategory(data: { name: string; description?: string }) {
  return apiRequest<Category>('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
    auth: true,
  });
}

export function createMenuItem(data: any) {
  return apiRequest<MenuItem>('/menu', {
    method: 'POST',
    body: JSON.stringify(data),
    auth: true,
  });
}
