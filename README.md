# 🎒 CASPETE — Loncheras Escolares Inteligentes

![Estado: Producción](https://img.shields.io/badge/Estado-Producci%C3%B3n-brightgreen)
![Versión: 1.0.0](https://img.shields.io/badge/Versi%C3%B3n-1.0.0-blue)
![Stack: Node.js + React](https://img.shields.io/badge/Stack-Node.js%20%2B%20React-informational)
![Cumplimiento: Ley 1581 + Ley 2120](https://img.shields.io/badge/Cumplimiento-Ley%201581%20%2B%20Ley%202120-orange)

---

## 📖 Visión General

**Caspete** es una plataforma SaaS multi-tenant de producción para la gestión digital de loncheras escolares en Colombia. Conecta a padres de familia, colegios y tenderos en un ecosistema seguro, sin manejo de efectivo y con cumplimiento regulatorio completo.

### 💡 Propuesta de Valor
| Actor | Beneficio |
|---|---|
| **Padres** | Programan y pagan loncheras desde el celular. Sin efectivo, con historial y control de saldo. |
| **Niños** | Reciben su lonchera verificada por QR. Sin riesgo de pérdida de dinero. |
| **Tenderos** | Ven los pedidos del día en tiempo real. Planifican inventario con exactitud. |
| **Colegios** | Reportes nutricionales, control de consumo y recaudo financiero digital. |

---

## ⚙️ Stack Tecnológico

### Backend
| Componente | Tecnología |
|---|---|
| Runtime | Node.js + TypeScript (ESM) |
| Framework | Express 5 |
| ORM | Prisma 7 |
| Base de datos | PostgreSQL 16 (multi-tenant por `school_id`) |
| Autenticación | JWT (15min) + Refresh Token rotativo (30 días) |
| OAuth | Google OAuth 2.0 vía Passport.js |
| Email | Resend API |
| Pagos | Nequi Push Payments |
| Notificaciones | Web Push (VAPID) |
| Tareas programadas | node-cron (America/Bogota) |
| Gestor de paquetes | **pnpm** |

### Frontend
| Componente | Tecnología |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Router | React Router v7 |
| HTTP Client | Axios (con interceptor JWT auto-refresh) |
| Estilos | CSS Vanilla (design system propio) |
| QR | QR Scanner integrado para entrega de pedidos |

---

## 👥 Roles del Sistema

| Rol | Código | Responsabilidad |
|:---|:---|:---|
| **Padre / Madre / Acudiente** | `PARENT` | Registrar hijos, recargar saldo, programar loncheras. |
| **Tendero** | `VENDOR` | Ver despachos del día, validar entrega por QR, comunicarse con padres. |
| **Admin Colegio** | `SCHOOL_ADMIN` | Gestionar tienda, productos, reportes nutricionales y financieros. |
| **Super Admin** | `SUPER_ADMIN` | Administrar colegios, configuraciones globales, compliance. |

---

## 💎 Planes de Suscripción

| Característica | ⚡ Básico | ⭐ Estándar | 👑 Premium |
|:---|:---:|:---:|:---:|
| **Tiendas por colegio** | 1 | 3 | Ilimitadas |
| **Estudiantes** | Hasta 200 | Hasta 500 | Ilimitados |
| **Usuarios admin** | 2 | 5 | Ilimitados |
| **Reportes** | Básicos | Avanzados | Completos + exportación |
| **Soporte** | Email | Email + Chat | Prioritario |
| **Personalización** | ❌ | ✅ | ✅ |
| **Notificaciones push** | ❌ | ✅ | ✅ |
| **API / Integraciones** | ❌ | ❌ | ✅ |

---

## ✅ Módulos Implementados

### Core
- [x] Autenticación: registro, login, Google OAuth, JWT refresh, reset de contraseña
- [x] RBAC: control de acceso por roles en todas las rutas
- [x] Gestión de Colegios (multi-tenant por `school_id`)
- [x] Gestión de Estudiantes (relación Padre-Hijo, saldo individual)
- [x] Gestión de Tiendas y Catálogo de Productos
- [x] Programación y gestión de Pedidos (PENDING → CONFIRMED → DELIVERED)
- [x] Entrega verificada por QR Scanner integrado
- [x] Transacciones: recargas, cargos, reembolsos, saldo en tiempo real
- [x] Solicitudes de recarga con aprobación por SCHOOL_ADMIN
- [x] Notificaciones Web Push (VAPID) a padres

### Pagos
- [x] Nequi Push Payments — flujo asíncrono completo (initiate → polling → confirm/cancel)
- [x] Métodos de pago configurables por SUPER_ADMIN (NEQUI, Bancolombia, etc.)

### Compliance Legal
- [x] **Ley 1581/2012** — Protección de datos y habeas data
  - [x] 3 consentimientos obligatorios en registro (Art. 7, 9, 12)
  - [x] Módulo ARCO completo (Acceso, Rectificación, Cancelación, Oposición)
  - [x] Cookie Banner con consentimiento granular (analytics, marketing)
  - [x] AuditLog de todas las operaciones sobre datos personales
  - [x] Derecho al olvido con anonimización automática vía cron job (30 días gracia)
  - [x] Panel Privacy Compliance para SUPER_ADMIN
  - [x] Reporte SIC consolidado (exportable en JSON)
- [x] **Ley 2120/2021 + Resolución 2492/2022** — Etiquetado nutricional
  - [x] Clasificación nutricional de productos (LEVEL_1 / LEVEL_2)
  - [x] Sellos de advertencia (sodio, azúcares, grasas saturadas, trans, edulcorantes)
  - [x] Dashboard Ley 2120 para administradores
  - [x] Módulo de Proveedores con ficha técnica (trazabilidad Art. 32)
  - [x] Registro de brechas de seguridad con plazo SIC (15 días hábiles)

### Tareas Programadas (Cron Jobs)
- [x] `02:00 AM Bogotá` — Anonimización de usuarios con solicitud pendiente
- [x] `03:00 AM Bogotá` — Limpieza de tokens expirados y OTPs vencidos

### En Desarrollo
- [ ] Chat interno Tendero ↔ Padre (polling + Web Push) — **diseñado, pendiente implementar**
- [ ] Integración ePayco como segunda pasarela

---

## 🚀 Guía de Inicio Rápido

### Requisitos
- Node.js 20+
- pnpm 9+
- PostgreSQL 16
- Variables de entorno configuradas (ver sección siguiente)

### Backend
```bash
cd backend
pnpm install
pnpm db:migrate      # Aplica migraciones Prisma
pnpm db:generate     # Regenera el cliente Prisma
pnpm db:seed         # Datos iniciales
pnpm dev             # Servidor en http://localhost:3001
```

### Frontend
```bash
cd frontend
pnpm install
pnpm dev             # App en http://localhost:5173
```

---

## 🔑 Variables de Entorno

### Backend (`.env`)
```env
DATABASE_URL=postgresql://user:pass@host:5432/caspete
JWT_SECRET=               # mín. 32 caracteres
REFRESH_TOKEN_SECRET=     # mín. 32 caracteres
JWT_EXPIRES_IN=15m
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://tudominio.com
RESEND_API_KEY=           # API key de Resend
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://api.tudominio.com/api/auth/google/callback
NEQUI_API_URL=https://api.nequi.com
NEQUI_CLIENT_ID=
NEQUI_CLIENT_SECRET=
NEQUI_API_KEY=
NEQUI_CHANNEL=PNP04-C001
VAPID_PUBLIC_KEY=         # Web Push
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@caspete.com
```

### Frontend (`.env.local`)
```env
VITE_API_URL=https://api.tudominio.com/api
VITE_VAPID_PUBLIC_KEY=    # Mismo VAPID_PUBLIC_KEY del backend
```

---

## 🏗️ Arquitectura de Módulos

```
backend/src/
├── modules/
│   ├── auth/          ← JWT + Google OAuth + refresh tokens
│   ├── schools/       ← Gestión multi-tenant de colegios
│   ├── students/      ← Estudiantes, saldo, alergias
│   ├── stores/        ← Tiendas escolares
│   ├── store-products/← Catálogo por tienda con precio/stock propio
│   ├── products/      ← Catálogo global + clasificación nutricional
│   ├── categories/    ← Categorías de productos
│   ├── orders/        ← Pedidos + QR delivery + OTP
│   ├── transactions/  ← Historial financiero
│   ├── topup-requests/← Recargas de saldo
│   ├── payment-methods/← Métodos de pago configurables
│   ├── users/         ← Gestión de usuarios
│   ├── reports/       ← Reportes y compliance Ley 2120
│   ├── suppliers/     ← Proveedores B2B (trazabilidad)
│   ├── allergies/     ← Alergias de estudiantes
│   ├── push/          ← Notificaciones Web Push
│   ├── arco/          ← Habeas Data + Ley 1581 + brechas SIC
│   └── chat/          ← [En desarrollo] Mensajería Tendero↔Padre
├── jobs/
│   ├── cron.ts                 ← Scheduler (node-cron, zona Bogotá)
│   ├── anonymize-users.job.ts  ← Ley 1581 Art. 15
│   └── cleanup-tokens.job.ts   ← Higiene de BD
├── lib/
│   ├── prisma.ts      ← Singleton Prisma
│   ├── email.ts       ← Resend wrapper
│   ├── nequi.ts       ← Nequi Push Payments
│   └── passport.ts    ← Google OAuth
└── middleware/
    ├── auth.middleware.ts      ← JWT extraction
    ├── rbac.middleware.ts      ← Role guards
    ├── audit-log.middleware.ts ← Trazabilidad Ley 1581
    └── error.middleware.ts     ← Centralizado
```

---

## 📞 Contacto y Soporte

**Responsable del tratamiento de datos:** Caspete.com  
**Email privacidad:** privacidad@caspete.com  
**Marco legal:** Ley 1581/2012 · Decreto 1377/2013 · Ley 2120/2021 · Resolución 2492/2022
