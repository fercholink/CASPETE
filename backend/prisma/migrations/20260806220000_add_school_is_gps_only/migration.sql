-- Colegio "placeholder" para estudiantes registrados en modo "solo localizar
-- y llamar" — su colegio real todavía no tiene convenio con Kidway. El
-- rastreo GPS de estos estudiantes es siempre en vivo (ver isTelemetryAllowed).
ALTER TABLE "School" ADD COLUMN "is_gps_only" BOOLEAN NOT NULL DEFAULT false;

INSERT INTO "School" (id, name, city, is_gps_only, active, created_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'Sin colegio afiliado (solo GPS)', '—', true, true, NOW())
ON CONFLICT (id) DO NOTHING;
