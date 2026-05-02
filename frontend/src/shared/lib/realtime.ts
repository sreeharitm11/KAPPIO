import { io, type Socket } from 'socket.io-client';
import { env } from '../config/env';
import { apiRequest } from './api-client';

let socket: Socket | null = null;

function socketBaseUrl(): string {
  if (env.socketUrl) {
    return env.socketUrl.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

export const notificationsSocket = {
  async connect(): Promise<Socket> {
    if (socket?.connected) {
      return socket;
    }

    const base = socketBaseUrl();
    let token: string | undefined;
    try {
      const t = await apiRequest<{ token: string }>('/auth/socket-token', { auth: true });
      token = t.token;
    } catch {
      /* not authenticated — caller should handle */
    }

    socket = io(`${base}/events`, {
      transports: ['websocket'],
      withCredentials: true,
      auth: token ? { token } : {},
    });

    return socket;
  },
  disconnect() {
    socket?.disconnect();
    socket = null;
  },
};
