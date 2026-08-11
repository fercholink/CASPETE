-- Compra del localizador GPS antes de que el padre tenga cuenta: paga
-- primero (transferencia + comprobante) para que se le pueda enviar el
-- dispositivo. Al despachar se asigna el IMEI real y se crea un GPSTracker
-- huérfano (sin student_id) marcado como comprado; cuando el padre se
-- registra y vincula ese mismo IMEI, la fila se reutiliza sin perder el
-- estado de pago.

-- CreateEnum
CREATE TYPE "GpsDeviceOrderStatus" AS ENUM ('PENDING', 'PAID_CONFIRMED', 'SHIPPED', 'REJECTED');

-- CreateTable
CREATE TABLE "GpsDeviceOrder" (
    "id" UUID NOT NULL,
    "contact_name" VARCHAR(200) NOT NULL,
    "contact_email" VARCHAR(255) NOT NULL,
    "contact_phone" VARCHAR(20) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "student_name" VARCHAR(200),
    "receipt_url" TEXT NOT NULL,
    "payment_reference" VARCHAR(100),
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "GpsDeviceOrderStatus" NOT NULL DEFAULT 'PENDING',
    "imei" VARCHAR(20),
    "tracking_number" VARCHAR(100),
    "tracker_id" UUID,
    "notes" TEXT,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GpsDeviceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GpsDeviceOrder_status_idx" ON "GpsDeviceOrder"("status");

-- CreateIndex
CREATE INDEX "GpsDeviceOrder_created_at_idx" ON "GpsDeviceOrder"("created_at");
