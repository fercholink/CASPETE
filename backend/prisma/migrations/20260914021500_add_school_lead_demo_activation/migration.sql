-- AlterTable SchoolLead: campos del flujo de activación de demo (invitación al rector)
ALTER TABLE "SchoolLead" ADD COLUMN IF NOT EXISTS "demo_token" TEXT;
ALTER TABLE "SchoolLead" ADD COLUMN IF NOT EXISTS "demo_token_expires" TIMESTAMP(3);
ALTER TABLE "SchoolLead" ADD COLUMN IF NOT EXISTS "demo_activated_at" TIMESTAMP(3);
ALTER TABLE "SchoolLead" ADD COLUMN IF NOT EXISTS "demo_school_id" UUID;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SchoolLead_demo_token_idx" ON "SchoolLead"("demo_token");
