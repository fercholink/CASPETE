-- Migration: add_habeas_data_ley1581
-- Ley 1581 de 2012 (Habeas Data) — Protección de datos personales y de menores
-- Decreto 1377 de 2013 — Circular 002 SIC (Accountability)

-- ── Campos de consentimiento en User (Art. 7, 9, 12) ────────────────────────
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "consent_general"      BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "consent_sensitive"    BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "consent_legal_rep"    BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "consent_timestamp"    TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "consent_version"      VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "consent_ip"           VARCHAR(45),
  ADD COLUMN IF NOT EXISTS "allow_analytics"      BOOLEAN   NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "allow_marketing"      BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "deletion_requested"   BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "deletion_requested_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletion_executed_at"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "anonymized"           BOOLEAN   NOT NULL DEFAULT FALSE;

-- ── AuditLog: registro de toda operación sobre datos personales ──────────────
-- (Accountability — Circular 002 SIC, Art. 17 Ley 1581/2012)
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
  "user_id"       UUID,
  "role"          VARCHAR(30),
  "action"        VARCHAR(30) NOT NULL,
  "entity"        VARCHAR(50) NOT NULL,
  "record_id"     VARCHAR(100),
  "fields"        TEXT[]      NOT NULL DEFAULT '{}',
  "ip_address"    VARCHAR(45),
  "justification" TEXT,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "AuditLog_entity_record_id_idx" ON "AuditLog"("entity", "record_id");
CREATE INDEX IF NOT EXISTS "AuditLog_user_id_created_at_idx" ON "AuditLog"("user_id", "created_at");

-- ── ArcoRequest: solicitudes formales de derechos ARCO (Art. 13–15) ─────────
CREATE TABLE IF NOT EXISTS "ArcoRequest" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     UUID        NOT NULL,
  "type"        VARCHAR(20) NOT NULL,
  "description" TEXT,
  "status"      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "resolved_at" TIMESTAMP(3),
  "response"    TEXT,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ArcoRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ArcoRequest_user_id_status_idx" ON "ArcoRequest"("user_id", "status");
