# CASPETE — Estructura del Proyecto y Roadmap de Implementación

**Ecosistema Digital Escolar** · Nutrición segura, futuro digital.

---

## 1. Estructura del Monorepo

Se recomienda un **monorepo con Turborepo** para coordinar backend, frontend y mobile desde un solo repositorio, con despliegues independientes.

```
caspete/
├── apps/
│   ├── api/                     # Laravel 11 (Backend API)
│   │   ├── app/
│   │   │   ├── Models/
│   │   │   │   ├── User.php
│   │   │   │   ├── School.php
│   │   │   │   ├── Store.php
│   │   │   │   ├── Student.php
│   │   │   │   ├── Guardian.php
│   │   │   │   ├── Product.php
│   │   │   │   ├── NutritionProfile.php
│   │   │   │   ├── Transaction.php
│   │   │   │   ├── Wallet.php
│   │   │   │   ├── Allergy.php
│   │   │   │   ├── Supplier.php
│   │   │   │   └── Order.php
│   │   │   ├── Http/
│   │   │   │   ├── Controllers/
│   │   │   │   │   ├── Api/V1/
│   │   │   │   │   │   ├── AuthController.php
│   │   │   │   │   │   ├── WalletController.php
│   │   │   │   │   │   ├── TransactionController.php
│   │   │   │   │   │   ├── ProductController.php
│   │   │   │   │   │   ├── StoreController.php
│   │   │   │   │   │   ├── StudentController.php
│   │   │   │   │   │   ├── NutritionController.php
│   │   │   │   │   │   ├── SupplierController.php
│   │   │   │   │   │   ├── ReportController.php
│   │   │   │   │   │   └── WebhookController.php
│   │   │   │   │   └── Api/V1/ (versionada)
│   │   │   │   ├── Middleware/
│   │   │   │   │   ├── EnsureSchoolContext.php
│   │   │   │   │   └── NutritionCompliance.php
│   │   │   │   └── Requests/
│   │   │   │       ├── StoreSaleRequest.php
│   │   │   │       └── RechargeWalletRequest.php
│   │   │   ├── Services/
│   │   │   │   ├── NutritionValidatorService.php   # Ley 2120
│   │   │   │   ├── PaymentGatewayService.php       # ePayco/MP
│   │   │   │   ├── WalletService.php
│   │   │   │   ├── InventoryService.php
│   │   │   │   └── NotificationService.php
│   │   │   ├── Events/
│   │   │   │   ├── WalletRecharged.php
│   │   │   │   ├── SaleCompleted.php
│   │   │   │   └── NutritionAlertTriggered.php
│   │   │   ├── Listeners/
│   │   │   ├── Policies/
│   │   │   └── Enums/
│   │   │       ├── UserRole.php        # admin, school_admin, storekeeper, guardian, student
│   │   │       ├── TransactionType.php # recharge, purchase, refund
│   │   │       └── NutritionFlag.php   # green, yellow, red
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   ├── seeders/
│   │   │   └── factories/
│   │   ├── routes/
│   │   │   └── api.php
│   │   ├── config/
│   │   ├── tests/
│   │   │   ├── Feature/
│   │   │   └── Unit/
│   │   ├── composer.json
│   │   └── .env.example
│   │
│   ├── web/                     # Next.js 14 (POS + Admin)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/
│   │   │   │   │   └── register/
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── pos/             # Vista del tendero
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── components/
│   │   │   │   │   │       ├── ProductGrid.tsx
│   │   │   │   │   │       ├── Cart.tsx
│   │   │   │   │   │       ├── StudentSearch.tsx
│   │   │   │   │   │       └── NutritionBadge.tsx
│   │   │   │   │   ├── inventory/
│   │   │   │   │   ├── reports/
│   │   │   │   │   ├── students/
│   │   │   │   │   └── suppliers/
│   │   │   │   ├── (admin)/
│   │   │   │   │   ├── schools/
│   │   │   │   │   ├── stores/
│   │   │   │   │   └── settings/
│   │   │   │   └── layout.tsx
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts        # Axios wrapper → Laravel API
│   │   │   │   ├── supabase-client.ts   # Realtime subscriptions
│   │   │   │   └── offline-cache.ts     # IndexedDB para POS offline
│   │   │   ├── hooks/
│   │   │   │   ├── useWalletRealtime.ts
│   │   │   │   ├── useOfflineSync.ts
│   │   │   │   └── useNutritionCheck.ts
│   │   │   ├── stores/                  # Zustand
│   │   │   │   ├── cart-store.ts
│   │   │   │   └── auth-store.ts
│   │   │   └── types/
│   │   ├── public/
│   │   ├── package.json
│   │   └── .env.local.example
│   │
│   └── mobile/                  # React Native (Expo)
│       ├── src/
│       │   ├── screens/
│       │   │   ├── auth/
│       │   │   ├── home/
│       │   │   │   └── HomeScreen.tsx       # Dashboard del padre
│       │   │   ├── wallet/
│       │   │   │   ├── WalletScreen.tsx     # Saldo y recargas
│       │   │   │   └── RechargeScreen.tsx
│       │   │   ├── nutrition/
│       │   │   │   └── NutritionScreen.tsx  # Historial alimenticio
│       │   │   ├── students/
│       │   │   │   └── StudentProfile.tsx
│       │   │   └── notifications/
│       │   ├── components/
│       │   │   ├── NutritionChart.tsx
│       │   │   ├── TransactionCard.tsx
│       │   │   └── AllergySelectorSheet.tsx
│       │   ├── services/
│       │   │   ├── api.ts
│       │   │   └── push-notifications.ts
│       │   ├── hooks/
│       │   ├── stores/
│       │   └── navigation/
│       ├── app.json
│       ├── eas.json
│       └── package.json
│
├── packages/                    # Código compartido
│   ├── shared-types/            # TypeScript types (contratos API)
│   │   ├── src/
│   │   │   ├── models.ts
│   │   │   ├── api-responses.ts
│   │   │   └── nutrition.ts
│   │   └── package.json
│   └── ui/                      # Componentes UI compartidos (web + mobile)
│       ├── src/
│       └── package.json
│
├── docs/
│   ├── api-spec.yaml            # OpenAPI 3.0
│   ├── database-schema.md
│   ├── ley-2120-compliance.md
│   └── deployment.md
│
├── infra/                       # IaC (opcional)
│   ├── docker-compose.yml       # Desarrollo local
│   └── supabase/
│       └── migrations/          # SQL versionado
│
├── turbo.json
├── package.json                 # Workspace root
└── README.md
```

---

## 2. Esquema de Base de Datos (PostgreSQL / Supabase)

### Tablas principales y relaciones

```sql
-- ============================================
-- TENANTS Y USUARIOS
-- ============================================

CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    nit VARCHAR(20) UNIQUE,             -- NIT del colegio
    city VARCHAR(100),
    department VARCHAR(100),
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    subscription_plan VARCHAR(50) DEFAULT 'basic',  -- basic, pro, enterprise
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN (
        'super_admin', 'school_admin', 'storekeeper', 'guardian', 'student'
    )),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    document_type VARCHAR(10),          -- CC, TI, CE, etc.
    document_number VARCHAR(30),
    is_active BOOLEAN DEFAULT true,
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_school ON users(school_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- ESTUDIANTES Y RELACIONES FAMILIARES
-- ============================================

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    grade VARCHAR(20),                  -- "5°A", "11°B"
    date_of_birth DATE,
    photo_url TEXT,
    daily_spending_limit DECIMAL(10,2) DEFAULT 15000,  -- Límite diario en COP
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relación N:N — Un estudiante puede tener varios acudientes
CREATE TABLE guardian_student (
    guardian_id UUID REFERENCES guardians(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    relationship VARCHAR(50) DEFAULT 'parent',  -- parent, grandparent, tutor
    is_primary BOOLEAN DEFAULT false,
    PRIMARY KEY (guardian_id, student_id)
);

-- ============================================
-- ALERGIAS Y RESTRICCIONES NUTRICIONALES
-- ============================================

CREATE TABLE allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,         -- "Gluten", "Lácteos", "Maní"
    severity VARCHAR(20) DEFAULT 'moderate',  -- mild, moderate, severe
    description TEXT
);

CREATE TABLE student_allergies (
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    allergy_id UUID REFERENCES allergies(id) ON DELETE CASCADE,
    notes TEXT,
    diagnosed_at DATE,
    PRIMARY KEY (student_id, allergy_id)
);

-- ============================================
-- TIENDA ESCOLAR E INVENTARIO
-- ============================================

CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    storekeeper_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,         -- "Bebidas", "Snacks", "Almuerzos"
    icon VARCHAR(50)
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,       -- Precio en COP
    cost DECIMAL(10,2),                 -- Costo proveedor
    barcode VARCHAR(50),
    image_url TEXT,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_alert INTEGER DEFAULT 5,
    -- Campos Ley 2120
    nutrition_flag VARCHAR(10) NOT NULL DEFAULT 'green'
        CHECK (nutrition_flag IN ('green', 'yellow', 'red')),
    calories_per_serving DECIMAL(8,2),
    sugar_grams DECIMAL(8,2),
    sodium_mg DECIMAL(8,2),
    saturated_fat_grams DECIMAL(8,2),
    is_ultra_processed BOOLEAN DEFAULT false,
    contains_added_sugar BOOLEAN DEFAULT false,
    -- Alérgenos presentes
    allergen_ids UUID[] DEFAULT '{}',   -- Array de IDs de alergias
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_flag ON products(nutrition_flag);

-- ============================================
-- WALLET Y TRANSACCIONES
-- ============================================

CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) DEFAULT 0.00
        CHECK (balance >= 0),
    last_recharge_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ⚡ Tabla con Supabase Realtime activado
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id),
    store_id UUID REFERENCES stores(id),
    type VARCHAR(20) NOT NULL
        CHECK (type IN ('recharge', 'purchase', 'refund', 'adjustment')),
    amount DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    -- Detalle de compra
    items JSONB,  -- [{product_id, name, qty, price, nutrition_flag}]
    -- Metadatos de pago
    payment_method VARCHAR(30),         -- 'pse', 'credit_card', 'cash', 'nequi'
    payment_reference VARCHAR(100),     -- ID externo de pasarela
    payment_status VARCHAR(20) DEFAULT 'completed',
    -- Auditoría
    processed_by UUID REFERENCES users(id),  -- tendero que procesó
    nutrition_alerts JSONB,             -- alertas generadas por Ley 2120
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_transactions_store ON transactions(store_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- ⚡ Tabla con Supabase Realtime activado
CREATE TABLE wallet_balances_realtime (
    wallet_id UUID PRIMARY KEY REFERENCES wallets(id),
    student_id UUID REFERENCES students(id),
    balance DECIMAL(12,2) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROVEEDORES (B2B)
-- ============================================

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    nit VARCHAR(20),
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    city VARCHAR(100),
    catalog_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE supplier_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    min_order_quantity INTEGER DEFAULT 1,
    unit_type VARCHAR(30),              -- "unidad", "caja", "paquete"
    nutrition_flag VARCHAR(10),
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id),
    supplier_id UUID REFERENCES suppliers(id),
    status VARCHAR(20) DEFAULT 'draft'
        CHECK (status IN ('draft', 'sent', 'confirmed', 'delivered', 'cancelled')),
    total DECIMAL(12,2),
    items JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDITORÍA Y REPORTES
-- ============================================

CREATE TABLE nutrition_daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    report_date DATE NOT NULL,
    total_calories DECIMAL(8,2) DEFAULT 0,
    total_sugar_grams DECIMAL(8,2) DEFAULT 0,
    total_sodium_mg DECIMAL(8,2) DEFAULT 0,
    green_items INTEGER DEFAULT 0,
    yellow_items INTEGER DEFAULT 0,
    red_items INTEGER DEFAULT 0,
    alerts_triggered INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, report_date)
);

CREATE INDEX idx_nutrition_reports_student ON nutrition_daily_reports(student_id, report_date DESC);
```

---

## 3. Rutas API (Laravel — api.php)

Todas las rutas viven bajo el prefijo `/api/v1/`.

```
Públicas (sin auth):
  POST   /auth/register
  POST   /auth/login
  POST   /auth/forgot-password
  POST   /webhooks/payment          ← Callback de ePayco/MP

Autenticadas (Sanctum token):
  POST   /auth/logout
  GET    /auth/me

  -- WALLET --
  GET    /wallets/{studentId}
  POST   /wallets/{studentId}/recharge
  GET    /wallets/{studentId}/transactions
  GET    /wallets/{studentId}/transactions/{id}

  -- POS (Tendero) --
  POST   /pos/sale                  ← Registrar venta (valida Ley 2120)
  POST   /pos/sale/{id}/refund
  GET    /pos/daily-summary

  -- PRODUCTOS --
  GET    /stores/{storeId}/products
  POST   /stores/{storeId}/products
  PUT    /stores/{storeId}/products/{id}
  DELETE /stores/{storeId}/products/{id}
  POST   /stores/{storeId}/products/bulk-import

  -- ESTUDIANTES --
  GET    /students
  GET    /students/{id}
  GET    /students/{id}/nutrition-report
  PUT    /students/{id}/allergies
  PUT    /students/{id}/spending-limit

  -- PROVEEDORES (B2B) --
  GET    /suppliers
  GET    /suppliers/{id}/catalog
  POST   /purchase-orders
  PUT    /purchase-orders/{id}/status

  -- REPORTES (Admin) --
  GET    /reports/nutrition/school/{schoolId}
  GET    /reports/sales/store/{storeId}
  GET    /reports/compliance/ley-2120

  -- ADMIN --
  GET    /admin/schools
  POST   /admin/schools
  PUT    /admin/schools/{id}
  GET    /admin/users
```

---

## 4. Lógica de Negocio Crítica

### 4.1 Validación Ley 2120 (NutritionValidatorService)

Antes de cada venta, el servicio valida:

1. **Semáforo nutricional**: Productos con `nutrition_flag = 'red'` activan alerta al padre.
2. **Límite diario de calorías**: Suma de calorías compradas hoy por el estudiante vs. umbral configurado por el colegio.
3. **Alergias del estudiante**: Cruza `product.allergen_ids` contra `student_allergies`. Si hay coincidencia → bloquea la venta y notifica.
4. **Ultra-procesados**: Conteo diario máximo de productos ultra-procesados (configurable por colegio).
5. **Gasto diario**: Valida que el monto no exceda `student.daily_spending_limit`.

La venta se procesa pero queda registrada con `nutrition_alerts` para trazabilidad.

### 4.2 Flujo de recarga con Realtime

```
Padre (App Móvil)
  ↓ POST /wallets/{id}/recharge
Laravel API
  ↓ Crea intención de pago en ePayco/MP
  ↓ Redirige al padre a la pasarela
Pasarela de Pagos
  ↓ POST /webhooks/payment (callback)
Laravel API
  ↓ Valida firma del webhook
  ↓ Actualiza wallet.balance (transacción DB)
  ↓ INSERT en transactions + wallet_balances_realtime
Supabase Realtime
  ↓ Detecta INSERT/UPDATE en wallet_balances_realtime
  ↓ Emite evento por canal
POS del Tendero (Next.js)
  ↓ Recibe evento → Actualiza saldo en pantalla al instante
```

---

## 5. Roadmap de Implementación por Fases

### Fase 0 — Cimientos (Semanas 1–3)

**Objetivo**: Infraestructura base funcional, sin lógica de negocio.

- Inicializar monorepo con Turborepo.
- Crear proyecto Laravel 11 con Sanctum configurado.
- Crear proyecto en Supabase, ejecutar migraciones del esquema completo.
- Crear proyecto Next.js con autenticación (login/registro).
- Crear proyecto Expo con navegación básica.
- Docker Compose para desarrollo local (PHP + PostgreSQL de Supabase local).
- CI/CD básico con GitHub Actions (lint + tests).
- Definir `shared-types` con los contratos TypeScript de la API.

**Entregable**: Login funcional en web y mobile contra la API.

---

### Fase 1 — MVP Wallet + POS (Semanas 4–8)

**Objetivo**: Un tendero puede vender a un estudiante usando saldo digital.

- CRUD de productos con semáforo nutricional (sin validación Ley 2120 aún).
- Wallet: recarga manual (admin agrega saldo) + vista de saldo.
- POS básico: buscar estudiante → seleccionar productos → cobrar del wallet.
- Historial de transacciones (tendero y padre).
- Supabase Realtime conectado: POS muestra saldo actualizado en tiempo real.
- Caché offline en POS (IndexedDB) para catálogo de productos.
- Tests unitarios y de integración para `WalletService`.

**Entregable**: Demo funcional: padre ve saldo, tendero vende, saldo se descuenta.

---

### Fase 2 — Pasarela de Pagos + Ley 2120 (Semanas 9–13)

**Objetivo**: Recargas reales con PSE/tarjeta + cumplimiento nutricional.

- Integración con ePayco o MercadoPago (webhooks incluidos).
- `NutritionValidatorService` completo: semáforo, alergias, límites, ultra-procesados.
- CRUD de alergias por estudiante (padre configura desde app).
- Push notifications (Firebase): alertas de nutrición al padre en cada compra.
- Reportes nutricionales diarios por estudiante.
- Límite de gasto diario configurable por el padre.
- Tests E2E del flujo completo: recarga → compra → alerta → reporte.

**Entregable**: Flujo completo monetizado con cumplimiento Ley 2120.

---

### Fase 3 — Admin + Proveedores B2B (Semanas 14–18)

**Objetivo**: Panel administrativo del colegio y marketplace de proveedores.

- Dashboard del colegio: métricas de ventas, cumplimiento nutricional, alumnos activos.
- Gestión de tiendas y tenderos por el admin del colegio.
- Módulo de proveedores: catálogo, órdenes de compra, seguimiento.
- Reportes exportables (PDF/Excel) para el colegio.
- Roles y permisos granulares (`Policies` en Laravel).
- Onboarding guiado para nuevos colegios.

**Entregable**: Un colegio puede auto-gestionar su ecosistema completo.

---

### Fase 4 — Escalabilidad + Producción (Semanas 19–22)

**Objetivo**: Hardening para producción y múltiples colegios.

- Multi-tenancy completo (aislamiento de datos por `school_id`).
- Rate limiting y protección contra abuso en la API.
- Monitoreo: Laravel Telescope + Sentry + métricas de Supabase.
- Plan de contingencia offline para POS (venta con sincronización posterior).
- Pruebas de carga: simular 50 ventas simultáneas por tienda.
- Documentación API con OpenAPI/Swagger.
- Despliegue en producción: Laravel Forge + Vercel + EAS.

**Entregable**: Plataforma lista para piloto con 3-5 colegios.

---

### Fase 5 — Crecimiento (Post-lanzamiento)

- App para estudiantes con QR de identificación.
- Programa de lealtad (puntos verdes por compras saludables).
- IA para recomendaciones nutricionales personalizadas.
- Integración con SIMAT (Sistema de Matrícula del MEN).
- API pública para integración con ERPs escolares.
- Facturación electrónica (DIAN).

---

## 6. Decisiones de Arquitectura Clave

| Decisión | Elección | Justificación |
|----------|----------|---------------|
| API versionada | `/api/v1/` | Permite evolucionar sin romper clientes existentes |
| Sanctum (no Passport) | API Tokens | Más simple para SPA + Mobile, sin complejidad OAuth |
| Supabase Realtime (no Pusher) | Canal directo a DB | Elimina un servicio intermedio, el POS escucha cambios directos |
| Zustand (no Redux) | Estado en frontends | Ligero, sin boilerplate, ideal para POS rápido |
| Turborepo | Monorepo | Un solo repo, builds paralelos, tipos compartidos |
| IndexedDB para POS | Caché offline | Resiliencia ante caídas de red en tiendas escolares |
| JSONB para items en transacciones | Desnormalización controlada | Captura el "snapshot" de la venta (precio al momento, semáforo) |
| UUID como PK | Escalabilidad | Compatible con Supabase, sin conflictos en multi-tenant |

---

## 7. Checklist para Empezar Hoy

- [ ] Crear cuenta de Supabase y proyecto nuevo.
- [ ] Inicializar monorepo: `npx create-turbo@latest caspete`.
- [ ] Crear proyecto Laravel: `composer create-project laravel/laravel apps/api`.
- [ ] Configurar conexión de Laravel a Supabase (credenciales PostgreSQL).
- [ ] Ejecutar las migraciones del esquema de la sección 2.
- [ ] Instalar Sanctum y configurar autenticación API.
- [ ] Crear proyecto Next.js: `npx create-next-app apps/web`.
- [ ] Crear proyecto Expo: `npx create-expo-app apps/mobile`.
- [ ] Definir `packages/shared-types` con los modelos TypeScript.
- [ ] Crear `docker-compose.yml` para desarrollo local.
- [ ] Configurar GitHub repo con branch protection y CI básico.
