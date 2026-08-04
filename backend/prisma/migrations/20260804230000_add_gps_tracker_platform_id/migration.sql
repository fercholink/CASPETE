-- Vincula cada GPSTracker de Caspete con su Tracker correspondiente en la
-- Plataforma GPS externa (gps.bscomunicaciones.com), que ahora es quien
-- recibe la conexión real del dispositivo por SIM.
ALTER TABLE "GPSTracker" ADD COLUMN "platform_tracker_id" UUID;
