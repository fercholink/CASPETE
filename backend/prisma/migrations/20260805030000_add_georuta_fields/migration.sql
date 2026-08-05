-- Georuta: trayecto esperado casa↔colegio con alerta de desviación.
ALTER TABLE "Student" ADD COLUMN "home_latitude" DECIMAL(10,7);
ALTER TABLE "Student" ADD COLUMN "home_longitude" DECIMAL(10,7);
ALTER TABLE "GPSTracker" ADD COLUMN "platform_route_id" UUID;
