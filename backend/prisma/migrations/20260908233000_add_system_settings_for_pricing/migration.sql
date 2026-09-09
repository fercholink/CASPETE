-- CreateTable SystemSetting
CREATE TABLE IF NOT EXISTS "SystemSetting" (
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- Insert default GPS pricing if not already present
INSERT INTO "SystemSetting" ("key", "value", "description")
VALUES 
  ('gps_device_price', '120000', 'Precio de compra única del dispositivo localizador GPS en COP'),
  ('gps_monthly_price', '30000', 'Precio de suscripción mensual base GPS en COP (llamadas ilimitadas a 3 números + 1 familiar incluido)'),
  ('gps_extra_guardian_price', '5000', 'Tarifa mensual por familiar adicional a partir del segundo en COP'),
  ('gps_included_guardians', '1', 'Número de familiares incluidos sin costo adicional en el plan mensual base'),
  ('gps_max_emergency_numbers', '3', 'Cantidad máxima de números telefónicos autorizados para llamadas en el localizador')
ON CONFLICT ("key") DO NOTHING;
