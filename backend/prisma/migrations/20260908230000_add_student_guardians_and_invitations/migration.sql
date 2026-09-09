-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GuardianRelationship') THEN
    CREATE TYPE "GuardianRelationship" AS ENUM ('MOTHER', 'FATHER', 'GRANDPARENT', 'UNCLE_AUNT', 'LEGAL_TUTOR', 'FAMILY_OTHER');
  END IF;
END $$;

-- AlterTable GPSTracker
ALTER TABLE "GPSTracker" ADD COLUMN IF NOT EXISTS "included_guardians" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "GPSTracker" ADD COLUMN IF NOT EXISTS "custom_monthly_price" DECIMAL(10,2);
ALTER TABLE "GPSTracker" ADD COLUMN IF NOT EXISTS "custom_guardian_price" DECIMAL(10,2);
ALTER TABLE "GPSTracker" ADD COLUMN IF NOT EXISTS "max_emergency_numbers" INTEGER NOT NULL DEFAULT 3;

-- CreateTable StudentGuardian
CREATE TABLE IF NOT EXISTS "StudentGuardian" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "parent_id" UUID NOT NULL,
    "guardian_id" UUID,
    "guardian_email" VARCHAR(255) NOT NULL,
    "relationship" "GuardianRelationship" NOT NULL DEFAULT 'FAMILY_OTHER',
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "invite_token" VARCHAR(64),
    "can_view_live" BOOLEAN NOT NULL DEFAULT true,
    "can_view_history" BOOLEAN NOT NULL DEFAULT true,
    "can_receive_alerts" BOOLEAN NOT NULL DEFAULT true,
    "can_view_meals" BOOLEAN NOT NULL DEFAULT false,
    "is_included_slot" BOOLEAN NOT NULL DEFAULT false,
    "extra_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentGuardian_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "StudentGuardian_invite_token_key" ON "StudentGuardian"("invite_token");
CREATE UNIQUE INDEX IF NOT EXISTS "StudentGuardian_student_id_guardian_email_key" ON "StudentGuardian"("student_id", "guardian_email");
CREATE INDEX IF NOT EXISTS "StudentGuardian_guardian_id_active_idx" ON "StudentGuardian"("guardian_id", "active");
CREATE INDEX IF NOT EXISTS "StudentGuardian_student_id_idx" ON "StudentGuardian"("student_id");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentGuardian_student_id_fkey') THEN
    ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentGuardian_parent_id_fkey') THEN
    ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentGuardian_guardian_id_fkey') THEN
    ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
