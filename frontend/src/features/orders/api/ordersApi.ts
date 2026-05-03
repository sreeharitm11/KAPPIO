import { apiRequest } from '../../../shared/lib/api-client';
import type { Order, PaginatedResponse } from '../../../shared/types/api';

export function createOrder(payload: {
  customerId?: string;
  customerName?: string;
  customerPhone: string;
  deliveryAddress: string;
  tableNumber?: string;
  specialInstructions?: string;
  items: Array<{ menuItemId: string; quantity: number }>;
  latitude?: number;
  longitude?: number;
  deliveryDistance?: number;
  idempotencyKey?: string;
}) {
  return apiRequest<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('limit', String(params?.limit ?? 20));
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);

  return apiRequest<PaginatedResponse<Order>>(`/orders?${query.toString()}`, {
    auth: true,
  });
}

/** Customer order history (JWT + CUSTOMER role) */
export function fetchMyOrders(params?: { page?: number; limit?: number; status?: string }) {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('limit', String(params?.limit ?? 20));
  if (params?.status) query.set('status', params.status);

  return apiRequest<PaginatedResponse<Order>>(`/orders/me?${query.toString()}`, {
    auth: true,
  });
}

export function fetchOrderById(id: string, auth = true) {
  return apiRequest<Order>(`/orders/${id}`, {
    auth,
  });
}

export function trackOrder(orderNumber: string) {
  return apiRequest<Order>(`/orders/track/${orderNumber}`);
}

export function updateOrderStatus(id: string, status: string) {
  return apiRequest<Order>(`/orders/${id}/status`, {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify({ status }),
  });
}

export function acknowledgeOrderComment(id: string) {
  return apiRequest<Order>(`/orders/${id}/acknowledge-comment`, {
    method: 'PATCH',
    auth: true,
  });
}
