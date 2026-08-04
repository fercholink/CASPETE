-- ============================================================
-- Migración: add_supplier_charges
-- Fecha: 2026-07-24
-- Descripción: Segunda fuente de ingreso del modelo de negocio —
--              tarifa mensual que los proveedores pagan por listar
--              sus productos para que los tenderos los ofrezcan.
-- ============================================================

-- ── Tarifa de listado en Supplier ─────────────────────────────
ALTER TABLE "Supplier"
  ADD COLUMN "listing_fee_monthly" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- ── Cobros mensuales por proveedor ─────────────────────────────
CREATE TYPE "SupplierChargeStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

CREATE TABLE "SupplierCharge" (
  "id"          UUID                   NOT NULL DEFAULT gen_random_uuid(),
  "supplier_id" UUID                   NOT NULL,
  "period"      VARCHAR(7)             NOT NULL,
  "amount"      DECIMAL(10,2)          NOT NULL,
  "status"      "SupplierChargeStatus" NOT NULL DEFAULT 'PENDING',
  "paid_at"     TIMESTAMP(3),
  "created_at"  TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupplierCharge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SupplierCharge_supplier_id_period_key" UNIQUE ("supplier_id", "period")
);

ALTER TABLE "SupplierCharge"
  ADD CONSTRAINT "SupplierCharge_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
