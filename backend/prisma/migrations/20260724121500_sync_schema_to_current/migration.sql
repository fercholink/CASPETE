-- CreateEnum
CREATE TYPE "TopupRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AgeSegment" AS ENUM ('PRESCHOOL', 'PRIMARY', 'SECONDARY', 'ALL_AGES');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('FOOD', 'DRINK', 'SNACK', 'SUPPLEMENT', 'COMBO');

-- CreateEnum
CREATE TYPE "AcquisitionModel" AS ENUM ('COMMISSION', 'MONTHLY_FEE');

-- CreateEnum
CREATE TYPE "MealPaymentModel" AS ENUM ('PER_ORDER', 'INCLUDED');

-- CreateEnum
CREATE TYPE "PositionSource" AS ENUM ('GPS', 'WIFI', 'LBS');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductForm" ADD VALUE 'SEMI_SOLID';
ALTER TYPE "ProductForm" ADD VALUE 'POWDER';
ALTER TYPE "ProductForm" ADD VALUE 'GEL';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'TEACHER';

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_user_id_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_product_id_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_school_id_fkey";

-- DropIndex
DROP INDEX "Product_nutritional_level_idx";

-- AlterTable
ALTER TABLE "Allergy" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ArcoRequest" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "LunchOrder" ADD COLUMN     "charged_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "NutritionDailyReport" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "product_id",
ADD COLUMN     "customizations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "store_product_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "price",
DROP COLUMN "school_id",
ADD COLUMN     "age_segment" "AgeSegment" NOT NULL DEFAULT 'ALL_AGES',
ADD COLUMN     "base_price" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "category" VARCHAR(50),
ADD COLUMN     "category_id" UUID,
ADD COLUMN     "customizable_options" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "product_type" "ProductType" NOT NULL DEFAULT 'FOOD',
ADD COLUMN     "serving_size_g" DECIMAL(8,2),
ADD COLUMN     "serving_size_ml" DECIMAL(8,2),
ADD COLUMN     "servings_per_package" DECIMAL(6,1),
ADD COLUMN     "supplier_id" UUID;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "acquisition_model" "AcquisitionModel" NOT NULL DEFAULT 'COMMISSION',
ADD COLUMN     "attendance_qr_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "commission_rate" DECIMAL(5,2),
ADD COLUMN     "cost_per_meal" DECIMAL(10,2),
ADD COLUMN     "country_code" VARCHAR(5) DEFAULT '+57',
ADD COLUMN     "department" VARCHAR(100),
ADD COLUMN     "email" VARCHAR(255),
ADD COLUMN     "gps_tracking_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "meal_payment_model" "MealPaymentModel" NOT NULL DEFAULT 'PER_ORDER',
ADD COLUMN     "monthly_fee" DECIMAL(10,2),
ADD COLUMN     "phone" VARCHAR(20),
ADD COLUMN     "school_end_time" VARCHAR(5),
ADD COLUMN     "school_start_time" VARCHAR(5);

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "delivery_code" VARCHAR(6);

-- AlterTable
ALTER TABLE "Supplier" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SupplierCharge" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "auth_provider" VARCHAR(20) NOT NULL DEFAULT 'local',
ADD COLUMN     "country_code" VARCHAR(5) DEFAULT '+57',
ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "google_id" VARCHAR(100),
ADD COLUMN     "verification_token" TEXT,
ADD COLUMN     "verification_token_expires" TIMESTAMP(3),
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(10),
    "color" VARCHAR(20),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreProduct" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "price" DECIMAL(10,2),
    "stock" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_pension_extra" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StoreProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopupRequest" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "parent_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "receipt_url" TEXT NOT NULL,
    "status" "TopupRequestStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" VARCHAR(20),
    "payment_reference" VARCHAR(100),
    "nequi_transaction_id" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" UUID NOT NULL,
    "key" VARCHAR(30) NOT NULL,
    "label" VARCHAR(50) NOT NULL,
    "icon" VARCHAR(10) NOT NULL,
    "color" VARCHAR(20) NOT NULL,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuDay" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "menu_date" DATE NOT NULL,
    "soup" VARCHAR(200),
    "main_protein" VARCHAR(200) NOT NULL,
    "optional_protein" VARCHAR(200),
    "energetic" VARCHAR(200),
    "dessert" VARCHAR(200),
    "vegetarian_available" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuDayAllergen" (
    "menu_day_id" UUID NOT NULL,
    "allergy_id" UUID NOT NULL,

    CONSTRAINT "MenuDayAllergen_pkey" PRIMARY KEY ("menu_day_id","allergy_id")
);

-- CreateTable
CREATE TABLE "NutritionalAuditLog" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "editor_id" UUID NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prev_level" VARCHAR(10) NOT NULL DEFAULT 'LEVEL_1',
    "prev_seals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "new_level" VARCHAR(10) NOT NULL DEFAULT 'LEVEL_1',
    "new_seals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "product_form" VARCHAR(20),
    "sodium_per_100" DECIMAL(8,2),
    "added_sugars_pct" DECIMAL(5,2),
    "saturated_fat_pct" DECIMAL(5,2),
    "trans_fat_pct" DECIMAL(5,2),
    "has_sweeteners" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "NutritionalAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatThread" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "order_id" UUID,
    "vendor_id" UUID NOT NULL,
    "parent_id" UUID NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" VARCHAR(1000) NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolLead" (
    "id" UUID NOT NULL,
    "school_name" VARCHAR(200) NOT NULL,
    "nit" VARCHAR(20),
    "city" VARCHAR(100) NOT NULL,
    "contact_name" VARCHAR(200) NOT NULL,
    "contact_email" VARCHAR(255) NOT NULL,
    "contact_phone" VARCHAR(20),
    "students_count" INTEGER,
    "plan_interest" VARCHAR(20) NOT NULL,
    "message" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "specialty" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "academic_period" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "score" DECIMAL(5,2),
    "evaluation_name" VARCHAR(100),
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "attachment_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GPSTracker" (
    "id" UUID NOT NULL,
    "imei" VARCHAR(20) NOT NULL,
    "qr_token" VARCHAR(64) NOT NULL,
    "student_id" UUID,
    "device_name" VARCHAR(100),
    "battery_level" INTEGER DEFAULT 100,
    "signal_strength" INTEGER DEFAULT 100,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "last_seen_at" TIMESTAMP(3),
    "extended_tracking_until" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GPSTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GPSTelemetry" (
    "id" UUID NOT NULL,
    "tracker_id" UUID NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "speed" DECIMAL(5,2),
    "heading" DECIMAL(5,2),
    "altitude" DECIMAL(8,2),
    "battery_level" INTEGER,
    "signal_strength" INTEGER,
    "alert_type" VARCHAR(50),
    "source" "PositionSource" NOT NULL DEFAULT 'GPS',
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GPSTelemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "course_id" UUID,
    "teacher_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL DEFAULT 'CLASS_ARRIVAL',
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CourseToStudent" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_CourseToStudent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_name_key" ON "ProductCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StoreProduct_store_id_product_id_key" ON "StoreProduct"("store_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_key_key" ON "PaymentMethod"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_user_id_idx" ON "PushSubscription"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "MenuDay_school_id_menu_date_key" ON "MenuDay"("school_id", "menu_date");

-- CreateIndex
CREATE INDEX "NutritionalAuditLog_product_id_changed_at_idx" ON "NutritionalAuditLog"("product_id", "changed_at");

-- CreateIndex
CREATE INDEX "NutritionalAuditLog_editor_id_idx" ON "NutritionalAuditLog"("editor_id");

-- CreateIndex
CREATE INDEX "ChatThread_school_id_status_idx" ON "ChatThread"("school_id", "status");

-- CreateIndex
CREATE INDEX "ChatThread_vendor_id_idx" ON "ChatThread"("vendor_id");

-- CreateIndex
CREATE INDEX "ChatThread_parent_id_idx" ON "ChatThread"("parent_id");

-- CreateIndex
CREATE INDEX "ChatThread_order_id_idx" ON "ChatThread"("order_id");

-- CreateIndex
CREATE INDEX "ChatMessage_thread_id_created_at_idx" ON "ChatMessage"("thread_id", "created_at");

-- CreateIndex
CREATE INDEX "ChatMessage_sender_id_idx" ON "ChatMessage"("sender_id");

-- CreateIndex
CREATE INDEX "SchoolLead_status_idx" ON "SchoolLead"("status");

-- CreateIndex
CREATE INDEX "SchoolLead_created_at_idx" ON "SchoolLead"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_user_id_key" ON "Teacher"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "GPSTracker_imei_key" ON "GPSTracker"("imei");

-- CreateIndex
CREATE UNIQUE INDEX "GPSTracker_qr_token_key" ON "GPSTracker"("qr_token");

-- CreateIndex
CREATE UNIQUE INDEX "GPSTracker_student_id_key" ON "GPSTracker"("student_id");

-- CreateIndex
CREATE INDEX "GPSTelemetry_tracker_id_recorded_at_idx" ON "GPSTelemetry"("tracker_id", "recorded_at");

-- CreateIndex
CREATE INDEX "Attendance_student_id_scanned_at_idx" ON "Attendance"("student_id", "scanned_at");

-- CreateIndex
CREATE INDEX "Attendance_course_id_scanned_at_idx" ON "Attendance"("course_id", "scanned_at");

-- CreateIndex
CREATE INDEX "_CourseToStudent_B_index" ON "_CourseToStudent"("B");

-- CreateIndex
CREATE UNIQUE INDEX "User_google_id_key" ON "User"("google_id");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreProduct" ADD CONSTRAINT "StoreProduct_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreProduct" ADD CONSTRAINT "StoreProduct_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_store_product_id_fkey" FOREIGN KEY ("store_product_id") REFERENCES "StoreProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopupRequest" ADD CONSTRAINT "TopupRequest_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopupRequest" ADD CONSTRAINT "TopupRequest_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopupRequest" ADD CONSTRAINT "TopupRequest_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuDay" ADD CONSTRAINT "MenuDay_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuDayAllergen" ADD CONSTRAINT "MenuDayAllergen_menu_day_id_fkey" FOREIGN KEY ("menu_day_id") REFERENCES "MenuDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuDayAllergen" ADD CONSTRAINT "MenuDayAllergen_allergy_id_fkey" FOREIGN KEY ("allergy_id") REFERENCES "Allergy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionalAuditLog" ADD CONSTRAINT "NutritionalAuditLog_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionalAuditLog" ADD CONSTRAINT "NutritionalAuditLog_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "LunchOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "ChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GPSTracker" ADD CONSTRAINT "GPSTracker_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GPSTelemetry" ADD CONSTRAINT "GPSTelemetry_tracker_id_fkey" FOREIGN KEY ("tracker_id") REFERENCES "GPSTracker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToStudent" ADD CONSTRAINT "_CourseToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToStudent" ADD CONSTRAINT "_CourseToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

