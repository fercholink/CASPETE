# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CASPETE** is a multi-tenant SaaS platform for managing school lunch (loncheras) orders, payments, and nutrition compliance for Colombian schools. It connects parents, vendors (store managers), and school administrators with a digital wallet + QR delivery system.

Roles: `PARENT`, `VENDOR`, `SCHOOL_ADMIN`, `SUPER_ADMIN`

## Package Manager

> **IMPORTANTE:** Este proyecto usa **pnpm** como gestor de paquetes. NUNCA usar `npm install`.
> - Instalar deps: `pnpm install`
> - Añadir paquete: `pnpm add <pkg>`
> - Añadir dev dep: `pnpm add -D <pkg>`
> - Los Dockerfiles usan `corepack enable && corepack prepare pnpm@latest --activate`

## Commands

### Backend (`backend/`)
```bash
pnpm dev             # Start with hot reload (tsx watch)
pnpm build           # Compile TypeScript → dist/
pnpm start           # Run compiled server
pnpm db:migrate      # Apply Prisma migrations
pnpm db:generate     # Regenerate Prisma client after schema changes
pnpm db:studio       # Open Prisma Studio GUI
pnpm db:seed         # Seed initial data
```

### Frontend (`frontend/`)
```bash
pnpm dev             # Start Vite dev server (port 5173)
pnpm build           # Type check + production build
pnpm lint            # ESLint
pnpm preview         # Preview production build
```

Backend runs on `http://localhost:3001`, frontend on `http://localhost:5173`.

## Architecture

### Backend (`backend/src/`)

Feature-based module structure. Each module under `modules/` follows:
- `*.controller.ts` — HTTP handlers (req/res, call service)
- `*.service.ts` — Business logic and Prisma queries
- `*.router.ts` — Express route definitions with middleware
- `*.schemas.ts` — Zod validation schemas for inputs

**Core infrastructure:**
- `config/env.ts` — All env vars parsed + validated with Zod at startup
- `lib/prisma.ts` — Prisma client singleton
- `lib/passport.ts` — Google OAuth 2.0 (Passport.js)
- `lib/nequi.ts` — Nequi payment gateway client
- `lib/email.ts` — Resend email wrapper
- `middleware/auth.middleware.ts` — JWT extraction → `req.user`
- `middleware/rbac.middleware.ts` — Role-based route guards
- `middleware/error.middleware.ts` — Centralized error handling

**Modules:** `auth`, `schools`, `students`, `products`, `categories`, `stores`, `store-products`, `orders`, `transactions`, `users`, `reports`, `topup-requests`

**API response format:**
```typescript
{ success: boolean; data?: T; message?: string; error?: string }
```

### Frontend (`frontend/src/`)

- `api/client.ts` — Axios instance with JWT auto-attach and 401→refresh→retry interceptors
- `context/AuthContext.tsx` — Global user state; tokens stored in `localStorage` as `caspete_token` / `caspete_refresh_token`
- `hooks/useAuth.ts` — Consumes AuthContext
- `pages/` — Route-level components
- `components/` — Shared UI (`ProtectedRoute`, `QRScanner`)
- `router/` — React Router v7 config

### Database (Prisma + PostgreSQL)

Multi-tenancy via `school_id` FK across most tables. Core models: `School`, `User`, `Student`, `Store`, `Product`, `StoreProduct`, `LunchOrder`, `OrderItem`, `Transaction`, `TopupRequest`, `RefreshToken`.

After editing `prisma/schema.prisma`, always run `npm run db:generate` (and `npm run db:migrate` for schema changes).

### Authentication Flow

1. Login returns short-lived JWT (15 min) + long-lived refresh token
2. Axios interceptor attaches `Authorization: Bearer <token>` to every request
3. On 401, interceptor calls `POST /api/auth/refresh` and retries original request
4. Google OAuth via Passport → `/api/auth/google/callback` → frontend `AuthCallbackPage`

### Nequi Payment Integration

Async push-notification model (`backend/nequi_push_payments.md`):
1. Parent initiates topup → backend calls Nequi unregistered-payment endpoint
2. Nequi sends push to parent's phone
3. Backend polls `getStatusPayment` to confirm (status 35 = success, 33 = pending, 10-455 = failed)

## Environment Variables

**Backend `.env`** — key vars:
```
DATABASE_URL=postgresql://...
JWT_SECRET=           # min 32 chars
REFRESH_TOKEN_SECRET= # min 32 chars
JWT_EXPIRES_IN=15m
PORT=3001
FRONTEND_URL=http://localhost:5173
RESEND_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
NEQUI_API_URL=https://api.sandbox.nequi.com
```

**Frontend `.env.local`:**
```
VITE_API_URL=http://localhost:3001/api
```

## Design System

See `frontend/DESIGN.md` for full spec. Key tokens:
- **Colors:** Near Black `#0d0d0d` (text/buttons), Brand Green `#18E299` (CTAs/hover), Pure White `#ffffff` (background)
- **Font:** Inter for all text, Geist Mono for technical labels
- **Spacing:** 8px base unit; border-radius 16px (cards), 9999px (buttons/pills)
