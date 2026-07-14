/**
 * Zhongxun Locator Communication Protocol (V1.1/V1.2/V1.3)
 * Implementa solo el subconjunto mínimo documentado como requerido para
 * funcionalidad de ubicación (sección 9 del protocolo del fabricante):
 * 0x01 login, 0x08 heartbeat, 0x10/0x11 posición GPS, 0x13 estado, 0x30 hora.
 *
 * 0x17/0x18/0x19 (WiFi/LBS offline) quedan fuera de este alcance: su byte de
 * "longitud" en realidad es un contador de hotspots, no una longitud real
 * (lo documenta el propio fabricante) — requieren un parser estructural
 * aparte y una API externa de geolocalización de celdas/WiFi para producir
 * coordenadas reales. Sin eso, solo se puede reintentar con la última
 * posición GPS conocida — se deja para una iteración futura.
 */

export const FRAME_START = Buffer.from([0x78, 0x78]);
export const FRAME_END = Buffer.from([0x0d, 0x0a]);

export interface RawFrame {
  protocolNumber: number;
  data: Buffer; // contenido entre el byte de protocolo y el 0D0A final
  totalLength: number; // bytes totales consumidos del buffer (incluye 7878...0D0A)
}

/**
 * Extrae un frame confiando en el byte de longitud (protocolo, sección 3),
 * y verifica que efectivamente termine en 0D0A. Si no coincide, es un frame
 * de longitud variable (ej. WiFi/LBS) que no soportamos — se señala con `null`
 * y con `desync: true` para que el caller cierre la conexión de forma segura
 * en vez de intentar seguir leyendo un buffer potencialmente corrupto.
 */
export function extractFrame(buffer: Buffer): { frame: RawFrame | null; desync: boolean } {
  if (buffer.length < 5) return { frame: null, desync: false };
  if (buffer[0] !== 0x78 || buffer[1] !== 0x78) return { frame: null, desync: true };

  const lengthByte = buffer[2]!;
  const totalLength = 3 + lengthByte + 2;
  if (buffer.length < totalLength) return { frame: null, desync: false }; // esperar más datos

  const trailerOk = buffer[totalLength - 2] === 0x0d && buffer[totalLength - 1] === 0x0a;
  if (!trailerOk) return { frame: null, desync: true };

  const protocolNumber = buffer[3]!;
  const data = buffer.subarray(4, 3 + lengthByte);
  return { frame: { protocolNumber, data, totalLength }, desync: false };
}

export function buildReply(protocolNumber: number, data: Buffer = Buffer.alloc(0)): Buffer {
  const length = 1 + data.length;
  return Buffer.concat([FRAME_START, Buffer.from([length]), Buffer.from([protocolNumber]), data, FRAME_END]);
}

// ── 0x01 login ──────────────────────────────────────────────────────────────
export function decodeImei(bytes: Buffer): string {
  let digits = '';
  for (const b of bytes) {
    digits += ((b >> 4) & 0xf).toString();
    digits += (b & 0xf).toString();
  }
  return digits.slice(1); // 16 nibbles → IMEI de 15 dígitos (primer nibble es relleno)
}

export function buildLoginReply(success: boolean): Buffer {
  return buildReply(success ? 0x01 : 0x44);
}

// ── 0x10 / 0x11 posición GPS ─────────────────────────────────────────────────
export interface GpsFix {
  recordedAt: Date;
  satellites: number;
  latitude: number;
  longitude: number;
  speedKmh: number;
  heading: number;
  gpsFixed: boolean;
  altitude: number | null;
  alertType: 'vibration' | 'speeding' | 'low_power' | null;
}

function decodePlainDateTime(bytes: Buffer): Date {
  const year = 2000 + bytes[0]!;
  const month = bytes[1]!;
  const day = bytes[2]!;
  const hour = bytes[3]!;
  const minute = bytes[4]!;
  const second = bytes[5]!;
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

export function decodeGpsPosition(data: Buffer): GpsFix {
  const recordedAt = decodePlainDateTime(data.subarray(0, 6));
  const satellites = data[6]! & 0x0f;
  const latRaw = data.readUInt32BE(7);
  const lonRaw = data.readUInt32BE(11);
  const speedKmh = data[15]!;
  const byte1 = data[16]!;
  const byte2 = data[17]!;

  const gpsFixed = (byte1 & 0b0001_0000) !== 0;
  const isWest = (byte1 & 0b0000_1000) !== 0;
  const isNorth = (byte1 & 0b0000_0100) !== 0;
  const heading = ((byte1 & 0b0000_0011) << 8) | byte2;

  const latMagnitude = latRaw / 1_800_000;
  const lonMagnitude = lonRaw / 1_800_000;

  let altitude: number | null = null;
  let alertType: GpsFix['alertType'] = null;
  if (data.length >= 21) {
    altitude = data.readUInt16BE(18);
    const alarmByte = data[20]!;
    if (alarmByte & 0b0000_0001) alertType = 'vibration';
    else if (alarmByte & 0b0000_0010) alertType = 'speeding';
    else if (alarmByte & 0b0001_0000) alertType = 'low_power';
  }

  return {
    recordedAt,
    satellites,
    latitude: isNorth ? latMagnitude : -latMagnitude,
    longitude: isWest ? -lonMagnitude : lonMagnitude,
    speedKmh,
    heading,
    gpsFixed,
    altitude,
    alertType,
  };
}

export function buildPositionReply(protocolNumber: number, data: Buffer): Buffer {
  // El servidor responde con la fecha/hora recibida (primeros 6 bytes), sin el resto del payload
  return buildReply(protocolNumber, data.subarray(0, 6));
}

// ── 0x13 estado ──────────────────────────────────────────────────────────────
export interface DeviceStatus {
  batteryLevel: number;
  signalStrength: number | null;
}

export function decodeStatus(data: Buffer): DeviceStatus {
  return {
    batteryLevel: data[0]!,
    signalStrength: data.length >= 5 ? data[4]! : null,
  };
}

// ── 0x30 sincronización de hora — el servidor SIEMPRE responde en GMT+0 ─────
export function buildTimeSyncReply(now: Date = new Date()): Buffer {
  const data = Buffer.alloc(7);
  data.writeUInt16BE(now.getUTCFullYear(), 0);
  data.writeUInt8(now.getUTCMonth() + 1, 2);
  data.writeUInt8(now.getUTCDate(), 3);
  data.writeUInt8(now.getUTCHours(), 4);
  data.writeUInt8(now.getUTCMinutes(), 5);
  data.writeUInt8(now.getUTCSeconds(), 6);
  return buildReply(0x30, data);
}

// ── Codificadores (lado dispositivo→servidor) — usados por el simulador ────

export function encodeImei(imei: string): Buffer {
  const padded = imei.length === 15 ? `0${imei}` : imei; // 15 dígitos → 16 nibbles
  const bytes = Buffer.alloc(8);
  for (let i = 0; i < 8; i++) {
    const hi = parseInt(padded[i * 2]!, 10);
    const lo = parseInt(padded[i * 2 + 1]!, 10);
    bytes[i] = (hi << 4) | lo;
  }
  return bytes;
}

export function encodeLoginFrame(imei: string, softwareVersion = 1): Buffer {
  return buildReply(0x01, Buffer.concat([encodeImei(imei), Buffer.from([softwareVersion])]));
}

export function encodeHeartbeatFrame(): Buffer {
  return buildReply(0x08);
}

export interface SimulatedFix {
  date: Date;
  satellites: number;
  latitude: number;
  longitude: number;
  speedKmh: number;
  heading: number;
  gpsFixed: boolean;
}

export function encodeGpsPositionFrame(fix: SimulatedFix): Buffer {
  const data = Buffer.alloc(18);
  data[0] = fix.date.getUTCFullYear() - 2000;
  data[1] = fix.date.getUTCMonth() + 1;
  data[2] = fix.date.getUTCDate();
  data[3] = fix.date.getUTCHours();
  data[4] = fix.date.getUTCMinutes();
  data[5] = fix.date.getUTCSeconds();
  data[6] = 0x90 | (fix.satellites & 0x0f);

  const latMagnitude = Math.round(Math.abs(fix.latitude) * 1_800_000);
  const lonMagnitude = Math.round(Math.abs(fix.longitude) * 1_800_000);
  data.writeUInt32BE(latMagnitude, 7);
  data.writeUInt32BE(lonMagnitude, 11);
  data[15] = Math.max(0, Math.min(255, Math.round(fix.speedKmh)));

  let byte1 = 0;
  if (fix.gpsFixed) byte1 |= 0b0001_0000;
  if (fix.longitude < 0) byte1 |= 0b0000_1000; // West
  if (fix.latitude >= 0) byte1 |= 0b0000_0100; // North
  const heading = Math.max(0, Math.min(1023, Math.round(fix.heading)));
  byte1 |= (heading >> 8) & 0b11;
  data[16] = byte1;
  data[17] = heading & 0xff;

  return buildReply(0x10, data);
}

export function encodeStatusFrame(batteryLevel: number, signalStrength: number): Buffer {
  return buildReply(0x13, Buffer.from([batteryLevel, 1, 8, 3, signalStrength]));
}
