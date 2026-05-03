import { apiRequest } from '../../../shared/lib/api-client';

export function sendOtp(email: string) {
  return apiRequest<{ message: string }>('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function verifyOtp(email: string, otp: string) {
  return apiRequest<{ message: string; verified: boolean }>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
}
