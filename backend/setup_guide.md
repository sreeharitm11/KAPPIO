# Kappio Platform - Setup & Deployment Guide

This guide provides step-by-step instructions to set up the Kappio Cafe delivery and admin platform.

## 1. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
PORT=4000
APP_NAME="Kappio Backend"

# Database
DATABASE_URL=postgres://user:password@localhost:5432/kappio

# Security
JWT_SECRET="generate-a-strong-secret-here"
JWT_REFRESH_SECRET="generate-another-strong-secret-here"
JWT_EXPIRES_IN=7d

# CORS (Comma-separated origins, or leave blank to allow all for dev)
CORS_ORIGIN=http://localhost:5173
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_MAPPLS_API_KEY=yttlmtxaxsfrvnbjfxwhlpnhkamvzvaqqops
```

## 2. Database Setup

1. Ensure PostgreSQL is running.
2. Create a database named `kappio`.
3. The backend is configured with `synchronize: true` in `typeorm.config.ts`. On the first run, it will automatically create all necessary tables.

## 3. Initial Seeding

The platform includes a built-in `SeedService` that runs on startup. It automatically creates:
- Essential Roles (ADMIN, STAFF, DELIVERY, CUSTOMER)
- Default Admin User: `admin@kappio.com` / `admin123`
- Default Delivery Partner: `delivery@kappio.com` / `delivery123`

## 4. Running the Application

### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 5. Key Integrations

### Mappls Maps
- API Key: `yttlmtxaxsfrvnbjfxwhlpnhkamvzvaqqops`
- Used for: Geolocation, distance-based delivery fees, and delivery navigation.

### UPI Payments
- VPA: `Q06322913@ybl` (Kappio Cafe)
- Flow: Mobile users see UPI intent links; desktop/fallback users see a dynamic QR code.

### SMS / OTP
- Current Status: Mocked in `AuthService.sendOtp`.
- To enable live SMS: Replace the `console.log` in `backend/src/modules/auth/auth.service.ts` (line 204) with your SMS provider SDK call (e.g., Twilio, MSG91).

## 6. Manual Steps & Troubleshooting

- **CORS Issues**: If you encounter "Request Failed" and see CORS errors in the browser console, ensure the `CORS_ORIGIN` in the backend `.env` matches your frontend URL exactly (no trailing slash).
- **Internal Server Error**: If the dashboard shows an error, check the backend console. Most common issues are database connection failures or missing columns (which `synchronize: true` should handle).
- **Thermal Printing**: The platform uses a hidden iframe for 58mm thermal receipts. Ensure the browser has permission to trigger print dialogs.

## 7. Delivery Flow
1. Customer places order (Prepaid only for 1st order).
2. Admin Dashboard (Login: `admin@kappio.com`) shows new order.
3. Admin accepts order -> Order is automatically assigned to the Delivery Partner.
4. Delivery Partner (Login: `delivery@kappio.com`) sees the order in their "Assigned Orders" tab.
5. Delivery Partner marks as "Picked Up" -> "Delivered".
