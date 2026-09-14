/** Distancia en metros entre dos puntos (fórmula de Haversine). */
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Filtra el ruido normal del GPS en zonas urbanas (reflejo de señal entre
// edificios/multipath): cuando alguien está quieto, el dispositivo sigue
// reportando cada minuto con una variación de ~10-30m entre lecturas. Sin
// filtrar, dibujar una línea entre cada punto se ve como una maraña de
// zigzags aunque en la realidad no se haya movido. Se descarta un punto si
// queda a menos de thresholdMeters del último punto que sí se conservó (no
// del anterior en la lista cruda — así el ruido no se "acumula" de a
// poquitos hasta parecer un desplazamiento real).
export function removeGpsJitter<T extends { latitude: string; longitude: string }>(
  positions: T[],
  thresholdMeters = 15,
): T[] {
  const kept: T[] = [];
  for (const p of positions) {
    const last = kept[kept.length - 1];
    if (!last || haversineMeters(Number(last.latitude), Number(last.longitude), Number(p.latitude), Number(p.longitude)) > thresholdMeters) {
      kept.push(p);
    }
  }
  return kept;
}
