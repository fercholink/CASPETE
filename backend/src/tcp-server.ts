/**
 * Servidor TCP para rastreadores GPS (protocolo Zhongxun).
 * Ver backend/src/lib/tcp/zhongxun-protocol.ts para el detalle del framing.
 */
import net from 'net';
import { prisma } from './lib/prisma.js';
import { env } from './config/env.js';
import { isTelemetryAllowed } from './modules/gps/gps.service.js';
import {
  extractFrame,
  decodeImei,
  decodeGpsPosition,
  decodeStatus,
  buildLoginReply,
  buildPositionReply,
  buildReply,
  buildTimeSyncReply,
} from './lib/tcp/zhongxun-protocol.js';

const MAX_BUFFER_BYTES = 8192; // protección contra crecimiento ilimitado de búfer
const SOCKET_IDLE_TIMEOUT_MS = 5 * 60 * 1000; // desconectar si no hay actividad (heartbeat, etc.)

interface ConnectionState {
  buffer: Buffer;
  trackerId: string | null;
  imei: string | null;
}

async function handleLogin(socket: net.Socket, state: ConnectionState, data: Buffer) {
  const imei = decodeImei(data.subarray(0, 8));
  const tracker = await prisma.gPSTracker.findUnique({
    where: { imei },
    select: { id: true, active: true },
  });

  if (!tracker || !tracker.active) {
    socket.write(buildLoginReply(false));
    socket.destroy();
    return;
  }

  state.trackerId = tracker.id;
  state.imei = imei;
  await prisma.gPSTracker.update({
    where: { id: tracker.id },
    data: { online: true, last_seen_at: new Date() },
  }).catch(() => {});

  socket.write(buildLoginReply(true));
}

async function handleHeartbeat(state: ConnectionState) {
  if (!state.trackerId) return;
  await prisma.gPSTracker.update({
    where: { id: state.trackerId },
    data: { online: true, last_seen_at: new Date() },
  }).catch(() => {});
  // 0x08 no requiere respuesta (sección 8 del protocolo)
}

async function handleGpsPosition(socket: net.Socket, state: ConnectionState, protocolNumber: number, data: Buffer) {
  // Se responde siempre — si no se responde, el dispositivo desconecta y reintenta (sección 8)
  socket.write(buildPositionReply(protocolNumber, data));
  if (!state.trackerId) return;

  await prisma.gPSTracker.update({
    where: { id: state.trackerId },
    data: { online: true, last_seen_at: new Date() },
  }).catch(() => {});

  const fix = decodeGpsPosition(data);
  if (!fix.gpsFixed) return; // sin fix válido, no hay coordenada real que guardar

  const allowed = await isTelemetryAllowed(state.trackerId, fix.recordedAt);
  if (!allowed) return; // fuera de horario escolar±margen y sin rastreo extendido — no se persiste

  await prisma.gPSTelemetry.create({
    data: {
      tracker_id: state.trackerId,
      latitude: fix.latitude,
      longitude: fix.longitude,
      speed: fix.speedKmh,
      heading: fix.heading,
      altitude: fix.altitude,
      alert_type: fix.alertType,
      source: 'GPS',
      recorded_at: fix.recordedAt,
    },
  }).catch((err) => console.error('[GPS TCP] Error al guardar telemetría:', err));
}

async function handleStatus(socket: net.Socket, state: ConnectionState, data: Buffer) {
  socket.write(buildReply(0x13, data)); // eco exacto de lo recibido, tal como exige el protocolo
  if (!state.trackerId) return;

  const status = decodeStatus(data);
  await prisma.gPSTracker.update({
    where: { id: state.trackerId },
    data: {
      battery_level: status.batteryLevel,
      ...(status.signalStrength !== null && { signal_strength: status.signalStrength }),
      online: true,
      last_seen_at: new Date(),
    },
  }).catch(() => {});
}

function handleTimeSync(socket: net.Socket) {
  socket.write(buildTimeSyncReply());
}

async function dispatchFrame(socket: net.Socket, state: ConnectionState, protocolNumber: number, data: Buffer) {
  switch (protocolNumber) {
    case 0x01: return handleLogin(socket, state, data);
    case 0x08: return handleHeartbeat(state);
    case 0x10:
    case 0x11: return handleGpsPosition(socket, state, protocolNumber, data);
    case 0x13: return handleStatus(socket, state, data);
    case 0x30: return handleTimeSync(socket);
    default:
      // Protocolo reconocido a nivel de framing (longitud válida) pero sin handler —
      // se ignora sin romper la conexión (no requiere respuesta obligatoria).
      return;
  }
}

async function processBuffer(socket: net.Socket, state: ConnectionState) {
  for (;;) {
    const { frame, desync } = extractFrame(state.buffer);
    if (desync) {
      console.warn(`[GPS TCP] Frame no reconocido (posible protocolo WiFi/LBS variable no soportado) — cerrando conexión imei=${state.imei ?? '?'}`);
      socket.destroy();
      return;
    }
    if (!frame) {
      if (state.buffer.length > MAX_BUFFER_BYTES) {
        console.warn(`[GPS TCP] Búfer excede el máximo sin resolver un frame — cerrando conexión imei=${state.imei ?? '?'}`);
        socket.destroy();
      }
      return;
    }
    state.buffer = state.buffer.subarray(frame.totalLength);
    try {
      await dispatchFrame(socket, state, frame.protocolNumber, frame.data);
    } catch (err) {
      console.error('[GPS TCP] Error procesando frame:', err);
    }
  }
}

export function startGpsTcpServer(): net.Server {
  const server = net.createServer((socket) => {
    const state: ConnectionState = { buffer: Buffer.alloc(0), trackerId: null, imei: null };
    socket.setTimeout(SOCKET_IDLE_TIMEOUT_MS);

    socket.on('data', (chunk: Buffer) => {
      state.buffer = Buffer.concat([state.buffer, chunk]);
      void processBuffer(socket, state);
    });

    socket.on('timeout', () => socket.destroy());
    socket.on('error', () => socket.destroy());

    socket.on('close', () => {
      if (!state.trackerId) return;
      prisma.gPSTracker.update({
        where: { id: state.trackerId },
        data: { online: false },
      }).catch(() => {});
    });
  });

  server.listen(env.GPS_TCP_PORT, () => {
    console.log(`[GPS TCP] Servidor de rastreadores GPS escuchando en el puerto ${env.GPS_TCP_PORT}`);
  });

  return server;
}
