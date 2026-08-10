-- Número de la SIM del dispositivo GPS (llamadas de voz reales por la red
-- celular, fuera del protocolo TCP de datos/ubicación). Se guarda localmente
-- en Caspete, no pasa por la Plataforma GPS.
ALTER TABLE "GPSTracker" ADD COLUMN "phone_number" VARCHAR(20);
