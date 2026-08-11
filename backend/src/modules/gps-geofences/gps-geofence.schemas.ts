import { z } from 'zod';

const latLonSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

// shape es inmutable después de creado (la Plataforma GPS lo valida de nuevo
// del lado de allá) — por eso solo aparece en el schema de creación.
export const createGeofenceSchema = z
  .object({
    name: z.string().min(1).max(100),
    shape: z.enum(['CIRCLE', 'POLYGON']).default('CIRCLE'),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    radius_meters: z.coerce.number().int().positive().max(50000).optional(),
    points: z.array(latLonSchema).min(3).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.shape === 'CIRCLE') {
      if (data.latitude === undefined || data.longitude === undefined || data.radius_meters === undefined) {
        ctx.addIssue({ code: 'custom', message: 'Una geocerca circular requiere latitude, longitude y radius_meters' });
      }
    } else if (!data.points) {
      ctx.addIssue({ code: 'custom', message: 'Una geocerca poligonal requiere points (mínimo 3)' });
    }
  });
export type CreateGeofenceInput = z.infer<typeof createGeofenceSchema>;

// La geometría dentro del mismo shape sí se puede editar (mover el círculo,
// redibujar el polígono) — la Plataforma GPS rechaza mezclar campos del otro
// shape, no hace falta repetir esa validación aquí.
export const updateGeofenceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  active: z.boolean().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radius_meters: z.coerce.number().int().positive().max(50000).optional(),
  points: z.array(latLonSchema).min(3).optional(),
});
export type UpdateGeofenceInput = z.infer<typeof updateGeofenceSchema>;

export const linkTrackerSchema = z.object({
  tracker_id: z.string().uuid(), // GPSTracker.id de Kidway, no el id de la Plataforma GPS
});
export type LinkTrackerInput = z.infer<typeof linkTrackerSchema>;
