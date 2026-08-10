-- Plan "solo localizar y llamar" (School.is_gps_only): pago único del
-- dispositivo ($120.000) + suscripción mensual ($25.000, llamadas
-- ilimitadas + geolocalización en tiempo real). Mismo flujo de
-- transferencia manual + comprobante que TopupRequest, sin tocar el
-- saldo de loncheras.

-- CreateEnum
CREATE TYPE "GPSPaymentType" AS ENUM ('DEVICE', 'MONTHLY_SUBSCRIPTION');

-- AlterTable
ALTER TABLE "GPSTracker" ADD COLUMN "device_purchased" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GPSTracker" ADD COLUMN "subscription_paid_until" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "GPSPaymentRequest" (
    "id" UUID NOT NULL,
    "tracker_id" UUID NOT NULL,
    "parent_id" UUID NOT NULL,
    "type" "GPSPaymentType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "receipt_url" TEXT NOT NULL,
    "payment_reference" VARCHAR(100),
    "status" "TopupRequestStatus" NOT NULL DEFAULT 'PENDING',
    "period_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GPSPaymentRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GPSPaymentRequest" ADD CONSTRAINT "GPSPaymentRequest_tracker_id_fkey" FOREIGN KEY ("tracker_id") REFERENCES "GPSTracker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GPSPaymentRequest" ADD CONSTRAINT "GPSPaymentRequest_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
