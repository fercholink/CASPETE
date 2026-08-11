-- Galería de fotos del localizador GPS en la landing, administrable por
-- SUPER_ADMIN desde el panel (sin necesidad de deploy para cambiar fotos).

-- CreateTable
CREATE TABLE "GpsGalleryImage" (
    "id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "caption" VARCHAR(200),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GpsGalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GpsGalleryImage_active_idx" ON "GpsGalleryImage"("active");
