import { apiRequest } from '../../../shared/lib/api-client';
import type { Vendor } from '../../../shared/types/api';

export function fetchVendors() {
  return apiRequest<Vendor[]>('/vendors', {
    auth: true,
  });
}

export function createVendor(payload: Partial<Vendor>) {
  return apiRequest<Vendor>('/vendors', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function updateVendor(id: string, payload: Partial<Vendor>) {
  return apiRequest<Vendor>(`/vendors/${id}`, {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function deleteVendor(id: string) {
  return apiRequest<void>(`/vendors/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}
