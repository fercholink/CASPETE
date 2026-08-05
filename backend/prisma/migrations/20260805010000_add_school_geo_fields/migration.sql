-- Ubicación del colegio (habilita la geocerca "llegó/salió del colegio" en la
-- Plataforma GPS externa) y el id de esa geocerca una vez creada.
ALTER TABLE "School" ADD COLUMN "latitude" DECIMAL(10,7);
ALTER TABLE "School" ADD COLUMN "longitude" DECIMAL(10,7);
ALTER TABLE "School" ADD COLUMN "gps_geofence_id" UUID;
