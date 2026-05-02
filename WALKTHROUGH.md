# Kappio Walkthrough

This document provides a step-by-step guide to setting up, running, and using the Kappio application (backend and frontend).

---

## 1. Prerequisites
- **Node.js** (v16+ recommended)
- **pnpm** (or npm/yarn)
- **PostgreSQL** (ensure the service is running)

---

## 2. Backend Setup
1. **Install dependencies:**
   ```sh
   cd backend
   pnpm install
   ```
2. **Configure environment:**
   - Copy `.env.example` to `.env` and update DB credentials as needed.
3. **Prepare the database:**
   - Create the database and user in PostgreSQL as per `.env`.
   - Load the schema:
     ```sh
     psql -U <db_user> -d <db_name> -f db/schema.sql
     ```
4. **Run database seeders:**
   ```sh
   pnpm run seed
   ```
5. **Start the backend server:**
   ```sh
   pnpm start:dev
   ```
   - The API will be available at `http://localhost:3000`.

---

## 3. Frontend Setup
1. **Install dependencies:**
   ```sh
   cd frontend
   pnpm install
   ```
2. **Start the frontend server:**
   ```sh
   pnpm dev
   ```
   - The app will be available at `http://localhost:5173`.

---

## 4. Using the App
- **Customer:**
  - Browse menu, add items to cart, checkout.
  - Track orders.
- **Admin:**
  - Dashboard, manage orders, menu, categories, finance, and reports.

---

## 5. Useful API Endpoints
- See `backend/README.md` for UI-to-API mapping.

---

## 6. Troubleshooting
- Ensure PostgreSQL is running and credentials are correct.
- If you encounter build errors, check TypeScript and dependency versions.
- For database issues, verify schema and seed data.

---

## 7. Additional Notes
- Menu images use Unsplash links (see `backend/seed-menu.ts`).
- For spelling or content corrections, update the relevant files and rerun the seeder.

---

For further details, refer to the README files in each project folder.