import { describe, it, expect } from 'vitest';
import { haversineMeters, removeGpsJitter } from './geo.js';

describe('haversineMeters', () => {
  it('devuelve ~0 para el mismo punto', () => {
    expect(haversineMeters(6.9739133, -73.0473783, 6.9739133, -73.0473783)).toBeCloseTo(0, 1);
  });

  it('calcula ~111.32km por cada grado de latitud', () => {
    const d = haversineMeters(0, 0, 1, 0);
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });
});

describe('removeGpsJitter', () => {
  const p = (lat: number, lon: number) => ({ latitude: String(lat), longitude: String(lon) });

  it('conserva el primer punto siempre', () => {
    const result = removeGpsJitter([p(6.97, -73.04)]);
    expect(result).toHaveLength(1);
  });

  it('descarta puntos consecutivos dentro del umbral (ruido/jitter)', () => {
    // ~13m de diferencia entre estos dos puntos (mismo caso real observado: 06:20:30 -> 10:07:30)
    const result = removeGpsJitter([p(6.9739133, -73.0473783), p(6.9738128, -73.0473172)]);
    expect(result).toHaveLength(1);
  });

  it('conserva puntos que sí representan movimiento real (fuera del umbral)', () => {
    // ~17.6m de diferencia — caso real observado en el mismo tracker (10:07:30 -> 10:21:34)
    const result = removeGpsJitter([p(6.9739133, -73.0473783), p(6.9740600, -73.0473172)]);
    expect(result).toHaveLength(2);
  });

  it('no acumula ruido de a poquitos: compara siempre contra el último punto CONSERVADO, no el anterior crudo', () => {
    // Tres puntos, cada uno a ~8m del anterior crudo (dentro del umbral de 15m
    // par a par), pero el primero y el tercero quedan a ~16m entre sí. Si se
    // comparara contra el punto conservado (el primero), el tercero debe
    // conservarse igual — no debe "colarse" solo por ir de a poquitos.
    const result = removeGpsJitter([
      p(6.97000, -73.04000),
      p(6.97007, -73.04000), // ~7.8m del primero — descartado
      p(6.97014, -73.04000), // ~15.6m del primero (conservado) — se conserva
    ]);
    expect(result).toHaveLength(2);
  });

  it('respeta un umbral personalizado', () => {
    const result = removeGpsJitter([p(6.9739133, -73.0473783), p(6.9738128, -73.0473172)], 5);
    expect(result).toHaveLength(2);
  });
});
