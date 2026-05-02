import { apiRequest } from '../../../shared/lib/api-client';

export function sendOtp(phone: string) {
  return apiRequest<{ message: string }>('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export function verifyOtp(phone: string, otp: string) {
  return apiRequest<{ message: string; verified: boolean }>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, otp }),
  });
}
