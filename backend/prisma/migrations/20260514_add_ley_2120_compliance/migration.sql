-- ============================================================
-- Migración: add_ley_2120_compliance
-- Fecha: 2026-05-14
-- Descripción: Implementación de la Ley 2120 de 2021 y
--              Resolución 2492 de 2022 (Etiquetado Frontal)
-- ============================================================

-- Nuevos ENUM para clasificación nutricional
CREATE TYPE "NutritionalLevel" AS ENUM ('LEVEL_1', 'LEVEL_2');
CREATE TYPE "ProductForm"      AS ENUM ('SOLID', 'LIQUID');

-- ── Campos Ley 2120 en la tabla Product ──────────────────────
ALTER TABLE "Product"
  ADD COLUMN "product_form"            "ProductForm"      NOT NULL DEFAULT 'SOLID',
  ADD COLUMN "nutritional_level"       "NutritionalLevel" NOT NULL DEFAULT 'LEVEL_1',
  ADD COLUMN "sodium_per_100"          DECIMAL(8,2),
  ADD COLUMN "added_sugars_pct"        DECIMAL(5,2),
  ADD COLUMN "saturated_fat_pct"       DECIMAL(5,2),
  ADD COLUMN "trans_fat_pct"           DECIMAL(5,2),
  ADD COLUMN "has_sweeteners"          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "seal_sodium"             BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "seal_sugars"             BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "seal_saturated_fat"      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "seal_trans_fat"          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "seal_sweeteners"         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "supplier_tech_sheet_url" VARCHAR(500),
  ADD COLUMN "last_nutritional_audit"  TIMESTAMP(3);

-- Índice para filtro "Libre de Sellos"
CREATE INDEX "Product_nutritional_level_idx" ON "Product"("nutritional_level");

-- ── Campos de compliance en LunchOrder ───────────────────────
ALTER TABLE "LunchOrder"
  ADD COLUMN "is_seal_free"        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "has_sweetener_alert" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "seal_summary"        JSONB   NOT NULL DEFAULT '{}',
  ADD COLUMN "compliance_score"    INTEGER NOT NULL DEFAULT 100;

-- ── Módulo de Alergias (Ley 2120) ────────────────────────────
CREATE TABLE "Allergy" (
  "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
  "name"        VARCHAR(100) NOT NULL,
  "severity"    VARCHAR(20)  NOT NULL DEFAULT 'moderate',
  "description" TEXT,
  CONSTRAINT "Allergy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentAllergy" (
  "student_id"   UUID NOT NULL,
  "allergy_id"   UUID NOT NULL,
  "notes"        TEXT,
  "diagnosed_at" DATE,
  CONSTRAINT "StudentAllergy_pkey" PRIMARY KEY ("student_id","allergy_id")
);
ALTER TABLE "StudentAllergy"
  ADD CONSTRAINT "StudentAllergy_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "StudentAllergy_allergy_id_fkey" FOREIGN KEY ("allergy_id") REFERENCES "Allergy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProductAllergy" (
  "product_id" UUID NOT NULL,
  "allergy_id" UUID NOT NULL,
  CONSTRAINT "ProductAllergy_pkey" PRIMARY KEY ("product_id","allergy_id")
);
ALTER TABLE "ProductAllergy"
  ADD CONSTRAINT "ProductAllergy_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ProductAllergy_allergy_id_fkey" FOREIGN KEY ("allergy_id") REFERENCES "Allergy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Reporte diario nutricional por estudiante ─────────────────
CREATE TABLE "NutritionDailyReport" (
  "id"                UUID         NOT NULL DEFAULT gen_random_uuid(),
  "student_id"        UUID         NOT NULL,
  "report_date"       DATE         NOT NULL,
  "total_calories"    DECIMAL(8,2) NOT NULL DEFAULT 0,
  "total_sugar_grams" DECIMAL(8,2) NOT NULL DEFAULT 0,
  "total_sodium_mg"   DECIMAL(8,2) NOT NULL DEFAULT 0,
  "green_items"       INTEGER      NOT NULL DEFAULT 0,
  "yellow_items"      INTEGER      NOT NULL DEFAULT 0,
  "red_items"         INTEGER      NOT NULL DEFAULT 0,
  "alerts_triggered"  INTEGER      NOT NULL DEFAULT 0,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NutritionDailyReport_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NutritionDailyReport_student_id_report_date_key" UNIQUE ("student_id","report_date")
);
ALTER TABLE "NutritionDailyReport"
  ADD CONSTRAINT "NutritionDailyReport_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Módulo de Proveedores B2B (Art. 32 Res. 2492) ────────────
CREATE TABLE "Supplier" (
  "id"                     UUID         NOT NULL DEFAULT gen_random_uuid(),
  "name"                   VARCHAR(255) NOT NULL,
  "nit"                    VARCHAR(20),
  "contact_name"           VARCHAR(100),
  "contact_phone"          VARCHAR(20),
  "contact_email"          VARCHAR(255),
  "city"                   VARCHAR(100),
  "tech_sheet_url"         VARCHAR(500),
  "tech_sheet_uploaded_at" TIMESTAMP(3),
  "is_verified"            BOOLEAN      NOT NULL DEFAULT false,
  "active"                 BOOLEAN      NOT NULL DEFAULT true,
  "created_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- ── Campo límite de gasto diario en Student ───────────────────
ALTER TABLE "Student"
  ADD COLUMN "daily_spending_limit" DECIMAL(10,2) NOT NULL DEFAULT 15000.00;
