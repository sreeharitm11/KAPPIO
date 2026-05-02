import { apiRequest } from '../../../shared/lib/api-client';
import type { DeliveryAssignment } from '../../../shared/types/api';

export function fetchMyDeliveryOrders() {
  return apiRequest<DeliveryAssignment[]>('/delivery/me/orders', {
    auth: true,
  });
}

export function updateDeliveryStatus(orderId: string, status: 'PICKED_UP' | 'DELIVERED') {
  return apiRequest<DeliveryAssignment>(`/delivery/orders/${orderId}/status`, {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify({ status }),
  });
}

export function collectCodPayment(orderId: string, collectedAmount: number) {
  return apiRequest(`/payments/orders/${orderId}/cod/collect`, {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify({ collectedAmount }),
  });
}
