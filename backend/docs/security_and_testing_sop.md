# Kappio Café: Security & Automation Testing SOP

This document outlines the standard operating procedures for maintaining a secure and stable production environment for the Kappio Café ecosystem.

## 🔐 1. Cybersecurity Standards

### A. Authentication & Authorization
- **JWT Rotation**: All JWTs are issued with a short expiry (24h). Admin tokens should be audited for suspicious login patterns.
- **Role-Based Access Control (RBAC)**: Never bypass the `RolesGuard`. Every endpoint must have an explicit `@Roles(...)` decorator if it handles sensitive data.
- **Input Sanitization**: Use `class-validator` and `class-transformer` (which are already integrated) to strictly validate every incoming request body.

### B. Network & Infrastructure
- **Security Headers**: Ensure `Helmet` is enabled in `main.ts` to set CSP, HSTS, and XSS protection headers.
- **CORS Policy**: Strictly define allowed origins in production. Do not use `*`.
- **Rate Limiting**: Use `@nestjs/throttler` (already integrated) on public endpoints like `/api/v1/auth/login` to prevent brute-force attacks.

### C. Database Security
- **TypeORM Migrations**: Disable `synchronize: true` in production immediately. Use migrations to track schema changes.
- **SQL Injection**: Always use TypeORM's query builder or repository methods which parameterize queries by default. Avoid raw SQL strings.

---

## 🧪 2. Automation Testing Strategy

To ensure high reliability, we recommend a tiered testing approach.

### A. End-to-End (E2E) Testing with Playwright
Playwright is the industry standard for modern web apps. It supports multi-device testing (Mobile/Tablet/Desktop).

**Setup Instructions:**
1. Install Playwright in the frontend:
   ```bash
   cd frontend
   npm init playwright@latest
   ```
2. Key Test Flows to Automate:
   - **Customer Flow**: Guest user adds item -> cart -> checkout -> Mappls location select -> Success.
   - **Admin Flow**: Login -> Real-time notification received -> Accept Order -> Print Bill.
   - **Delivery Flow**: Login -> View assigned orders -> Update status to 'Delivered'.

### B. Integration Testing
- Test the integration between the Order Service and the Notifications Service (WebSockets).
- Verify that CSV exports contain the correct GST logic and total sums.

### C. Manual Security Audit (Checklist)
- [ ] Verify `jwt-auth.guard.ts` is applied to all `/api/v1/admin/*` routes.
- [ ] Check `vendor.entity.ts` for any leaked sensitive vendor data.
- [ ] Ensure `paymentStatus` cannot be manually manipulated via the frontend without a server-side balance check.

---

## 📈 3. Maintenance & Monitoring
- **Error Tracking**: Integrate Sentry or similar for real-time error monitoring.
- **Logs**: Monitor NestJS production logs for `UnauthorizedException` spikes.
