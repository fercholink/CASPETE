# Roadmap — Funcionalidades faltantes frente a la competencia

> **Corrección (2026-07-24):** la primera versión de este documento se basó en una memoria desactualizada del proyecto (83 días) y daba por hecho que CASPETE no tenía GPS real, refresh tokens, rate-limiting ni seguimiento nutricional. **Eso ya no es así** — se verificó contra el código real (`backend/src/modules`, `backend/prisma/schema.prisma`) y esta versión refleja el estado actual correctamente.

Análisis de brechas hecho contra los competidores directos en Colombia: **payGO** (83 colegios, 15 ciudades, 85,000 usuarios — líder de mercado en pago sin efectivo), **FoodCash** (fuerte en nutrición) y **Lonchi** (fuerte en optimización de inventario/cero desperdicio). Ninguno de los tres ofrece geolocalización — sigue siendo el diferenciador único de CASPETE, y ya está construido (`GPSTracker`/`GPSTelemetry`).

## Ya implementado (no requiere desarrollo)

- Refresh tokens (`RefreshToken` model, JWT 15min + refresh, interceptor 401 en frontend)
- Rate-limiting (login, registro, entrega, recuperación de cuenta)
- Notificaciones push (Web Push/VAPID, módulo `push`)
- GPS real vinculado a la tarjeta (`GPSTracker`, `GPSTelemetry`)
- Seguimiento nutricional avanzado (`MenuDay`, `Allergy`, `StudentAllergy`, `ProductAllergy`, `NutritionalAuditLog`, `NutritionDailyReport`) — cumplimiento Ley 2120, más completo que el de FoodCash
- Integración de pago Nequi
- Chat interno tendero↔padre
- Modelo `Supplier` con ficha técnica y verificación (base para el marketplace de proveedores, ver gap abajo)

## Gaps reales confirmados

### 1. Tests automatizados — ✅ Iniciado (2026-07-24)
`vitest` instalado y configurado (`pnpm test`). Primera suite: `backend/src/modules/orders/order.service.test.ts` (16 tests), cubriendo `createOrder` (validación de saldo, stock, guardas anti-carrera, modelo de pensión incluida), `deliverOrder` (verificación OTP), `cancelOrder` y `cancelOrderPartial` (reembolso completo vs. 50%).

**Limitación actual:** los tests usan Prisma mockeado, no una base de datos real — no había Docker instalado ni credenciales del Postgres local disponibles para levantar una BD de test aislada del servidor remoto de desarrollo. Cubre la lógica de negocio pero no errores reales de SQL/constraints de Postgres.

**Pendiente:** extender cobertura a `transactions`, `topup-requests`, `gps`; y cuando haya Docker o credenciales locales, agregar una capa de tests de integración reales contra Postgres.

### 2. Límites de gasto configurables por el padre — ✅ Hecho (2026-07-24)
El campo `Student.daily_spending_limit` ya existía en el schema desde mayo (migración `20260514_add_ley_2120_compliance`), default $15.000, pero no estaba conectado a nada. Se completó el cableado:
- `updateStudentSchema` acepta `daily_spending_limit` (0–1.000.000), y `student.service.ts` lo persiste y lo devuelve en `studentSelect`.
- `order.service.ts::createOrder` valida, antes de crear el pedido, que lo ya cobrado ese `scheduled_date` (pedidos no cancelados) más el monto de este pedido no supere el límite del estudiante; si lo supera, rechaza con `AppError` explicando cuánto lleva gastado.
- Frontend: `StudentFormPage.tsx` expone el campo en modo edición ("Límite de gasto diario").
- Tests añadidos a `order.service.test.ts` (excede el límite directo, excede sumado a lo ya gastado, dentro del límite).

**Limitación conocida:** a diferencia del descuento de saldo (que usa `updateMany` atómico dentro de la transacción para evitar doble-gasto por carrera), la validación del límite diario se hace antes de la transacción, sumando pedidos existentes. En un caso extremo de dos pedidos simultáneos del mismo estudiante muy cerca en el tiempo, podría colarse un pedido que sume ligeramente por encima del límite — no hay riesgo de pérdida de dinero (eso lo sigue protegiendo el descuento atómico de `balance`), solo de que el límite parental no sea 100% estricto bajo concurrencia extrema.

### 3. Comisión a proveedores por listar productos — ✅ Implementado en código (2026-07-24), ⚠️ migración pendiente de aplicar
`Product.supplier_id` ya vinculaba proveedor↔producto desde antes (para trazabilidad Ley 2120), pero no había ningún cobro asociado. Se agregó:
- `Supplier.listing_fee_monthly` (Decimal, default 0) — tarifa mensual que el proveedor paga por tener sus productos listados. Configurable desde `SupplierFormPage.tsx` (sección "Modelo de ingreso").
- Nuevo modelo `SupplierCharge` (`supplier_id`, `period` "YYYY-MM", `amount`, `status` PENDING/PAID/CANCELLED, `paid_at`), único por (proveedor, periodo) — evita cobros duplicados.
- Nuevo módulo `backend/src/modules/supplier-charges/`, montado en `/api/supplier-charges` (todo restringido a SUPER_ADMIN):
  - `POST /generate` `{ period: "YYYY-MM" }` — genera el cobro de ese mes para todo proveedor activo con `listing_fee_monthly > 0` y al menos un producto activo. Idempotente (usa `createMany` con `skipDuplicates`).
  - `GET /` — listado paginado con filtros.
  - `POST /:id/pay` — marca un cobro como pagado (registro manual, no hay pasarela automática todavía).
  - `POST /:id/cancel`, `GET /stats`.
- Tests con Prisma mockeado (12 casos): autorización, filtrado de proveedores elegibles, idempotencia, transiciones de estado.

**✅ Migración aplicada (2026-07-24)** contra `72.60.67.19` (`caspete_bd`) con confirmación explícita del usuario. Ver nota separada más abajo — "Hallazgo: historial de migraciones incompleto" — sobre un problema estructural preexistente del repo que apareció durante este proceso y que también se corrigió.

**No implementado (fuera de alcance de esta iteración):** cobro automático real (Nequi/transferencia) — hoy el flujo es "generar cobro → marcar pagado manualmente", igual que el patrón ya usado en `topup-requests` para recargas por transferencia antes de que existiera Nequi.

### 4. Infraestructura pesada (Fase 3 — evaluar por demanda real)
POS offline, kioscos táctiles de autopedido, integración contable directa (Siigo, etc.) — no encontrados en el código, y solo se justifican con volumen/tracción validada. payGO ya los ofrece a escala; construirlos antes de tener colegios activos sería sobre-invertir capital.

## Hallazgo: historial de migraciones incompleto (2026-07-24) — corregido

Al aplicar la migración de `SupplierCharge`, Prisma detectó "drift" masivo entre la base remota (`72.60.67.19`) y el historial de migraciones (`prisma/migrations/`): la base real tenía columnas y tablas (GPS, chat, profesores/cursos/notas, TopupRequest, categorías, School.country_code, etc.) que **nunca fueron capturadas en ningún archivo de migración** — probablemente porque en algún momento se usó `prisma db push` (que sincroniza el schema directo a la base sin dejar rastro) en vez de `prisma migrate dev`.

Con confirmación explícita del usuario (base sin datos reales), se hizo `prisma migrate reset --force` para sincronizar la base con el historial existente, y luego se generó una migración nueva (`20260724121500_sync_schema_to_current`) con el diff completo entre el historial y `schema.prisma`, aplicada con `migrate deploy`. Resultado: `prisma migrate diff ... --exit-code` confirma **cero diferencias** entre la base y el schema actual. Seed re-ejecutado sin errores, servidor arranca y responde en `/health`.

**Para que esto no vuelva a pasar:** usar siempre `prisma migrate dev` (que sí genera archivo de migración) en vez de `prisma db push` para cualquier cambio de schema, incluso en desarrollo rápido. Si alguien ya usó `db push`, correr `prisma migrate diff --from-config-datasource prisma.config.ts --to-schema prisma/schema.prisma --script` periódicamente para detectar drift temprano, antes de que se acumule.

## Prioridad sugerida para los próximos 4 meses

1. **Tests del flujo transaccional** — no negociable antes de escalar volumen con el colegio ancla.
2. **Límites de gasto** — cierra la brecha competitiva más citada, esfuerzo medio.
3. **Comisión a proveedores** — activa la segunda fuente de ingreso ya definida en el modelo de negocio.
4. Todo lo demás (Fase 3) queda pospuesto hasta validar tracción con los primeros colegios en Piedecuesta.
