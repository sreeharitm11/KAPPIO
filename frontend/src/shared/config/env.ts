/** Use `/api/v1` with Vite proxy to backend so httpOnly cookies stay same-site */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_URL ?? '/api/v1',
  /** Empty = same origin as the SPA (proxied WebSocket + cookies) */
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? '',
  demoCredentials: {
    admin: {
      email: import.meta.env.VITE_ADMIN_EMAIL,
      password: import.meta.env.VITE_ADMIN_PASSWORD,
    },
    delivery: {
      email: import.meta.env.VITE_DELIVERY_EMAIL,
      password: import.meta.env.VITE_DELIVERY_PASSWORD,
    },
  },
};
