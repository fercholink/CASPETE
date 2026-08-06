-- Horario exacto de recogida/llegada del trayecto (georuta) — reemplaza el
-- margen automático de ±45 min alrededor del horario escolar cuando el padre lo configura.
ALTER TABLE "Student" ADD COLUMN "route_morning_pickup" VARCHAR(5);
ALTER TABLE "Student" ADD COLUMN "route_morning_arrival" VARCHAR(5);
ALTER TABLE "Student" ADD COLUMN "route_afternoon_pickup" VARCHAR(5);
ALTER TABLE "Student" ADD COLUMN "route_afternoon_arrival" VARCHAR(5);
