/**
 * Nequi Push Payments — Servicio de integración
 * Documentación: nequi_push_payments.md
 *
 * Flujo:
 * 1. initiate() → Envía notificación push al cliente Nequi
 * 2. checkStatus() → Consulta estado del pago (polling)
 * 3. cancel() → Cancela solicitud pendiente
 *
 * Códigos de estado:
 *  33 = Pendiente | 35 = Aprobado | 10-455 = Rechazado | 10-454 = Expirado | 71 = Fallido
 */
import { env } from '../config/env.js';
import { AppError } from '../middleware/error.middleware.js';

const NEQUI_STATUS = {
  PENDING: '33',
  SUCCESS: '35',
  REJECTED: '10-455',
  EXPIRED: '10-454',
  FAILED: '71',
} as const;

function isConfigured(): boolean {
  return !!(env.NEQUI_CLIENT_ID && env.NEQUI_CLIENT_SECRET && env.NEQUI_API_KEY);
}

async function getAccessToken(): Promise<string> {
  if (!isConfigured()) throw new AppError('Nequi no está configurado', 503);

  const res = await fetch(`${env.NEQUI_API_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.NEQUI_CLIENT_ID,
      client_secret: env.NEQUI_CLIENT_SECRET,
    }),
  });

  if (!res.ok) throw new AppError('Error al autenticar con Nequi', 502);
  const data = await res.json();
  return data.access_token;
}

function buildRequestHeader(messageId: string) {
  return {
    Channel: env.NEQUI_CHANNEL,
    RequestDate: new Date().toISOString(),
    MessageID: messageId,
    ClientID: env.NEQUI_CLIENT_ID,
    Destination: {
      ServiceName: 'PaymentsService',
      ServiceOperation: 'unregisteredPayment',
      ServiceRegion: 'C001',
      ServiceVersion: '1.0.0',
    },
  };
}

/**
 * Inicia un pago push de Nequi.
 * Envía notificación push al celular del cliente.
 */
export async function initiatePayment(opts: {
  phoneNumber: string;
  amount: number;
  reference1: string; // e.g. topupRequest ID
  reference2: string; // e.g. student name
  reference3?: string;
}) {
  const token = await getAccessToken();
  const messageId = `CASP-${Date.now()}`;

  const body = {
    RequestMessage: {
      RequestHeader: buildRequestHeader(messageId),
      RequestBody: {
        any: {
          unregisteredPaymentRQ: {
            phoneNumber: opts.phoneNumber.replace(/\D/g, ''),
            value: String(opts.amount),
            reference1: opts.reference1,
            reference2: opts.reference2,
            reference3: opts.reference3 ?? 'CASPETE',
          },
        },
      },
    },
  };

  const res = await fetch(
    `${env.NEQUI_API_URL}/payments/v2/-services-paymentservice-unregisteredpayment`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-api-key': env.NEQUI_API_KEY,
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new AppError(`Nequi error: ${err}`, 502);
  }

  const data = await res.json();
  const statusCode = data?.ResponseMessage?.ResponseBody?.any?.unregisteredPaymentRS?.status?.statusCode;
  const transactionId = data?.ResponseMessage?.ResponseBody?.any?.unregisteredPaymentRS?.transactionId;

  return {
    success: true,
    messageId,
    transactionId: transactionId ?? messageId,
    statusCode: statusCode ?? NEQUI_STATUS.PENDING,
    rawResponse: data,
  };
}

/**
 * Consulta el estado de un pago push.
 */
export async function checkPaymentStatus(messageId: string) {
  const token = await getAccessToken();

  const body = {
    RequestMessage: {
      RequestHeader: {
        ...buildRequestHeader(messageId),
        Destination: {
          ...buildRequestHeader(messageId).Destination,
          ServiceOperation: 'getStatusPayment',
        },
      },
      RequestBody: {
        any: {
          getStatusPaymentRQ: { codeQR: messageId },
        },
      },
    },
  };

  const res = await fetch(
    `${env.NEQUI_API_URL}/payments/v2/-services-paymentservice-getstatuspayment`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-api-key': env.NEQUI_API_KEY,
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) throw new AppError('Error al consultar estado en Nequi', 502);

  const data = await res.json();
  const statusCode = data?.ResponseMessage?.ResponseBody?.any?.getStatusPaymentRS?.status?.statusCode ?? '';

  let status: 'PENDING' | 'SUCCESS' | 'REJECTED' | 'EXPIRED' | 'FAILED' = 'PENDING';
  if (statusCode === NEQUI_STATUS.SUCCESS) status = 'SUCCESS';
  else if (statusCode === NEQUI_STATUS.REJECTED) status = 'REJECTED';
  else if (statusCode === NEQUI_STATUS.EXPIRED) status = 'EXPIRED';
  else if (statusCode === NEQUI_STATUS.FAILED) status = 'FAILED';

  return { status, statusCode, rawResponse: data };
}

/**
 * Cancela un pago push pendiente.
 */
export async function cancelPayment(messageId: string) {
  const token = await getAccessToken();

  const body = {
    RequestMessage: {
      RequestHeader: {
        ...buildRequestHeader(messageId),
        Destination: {
          ...buildRequestHeader(messageId).Destination,
          ServiceOperation: 'cancelUnregisteredPayment',
        },
      },
      RequestBody: {
        any: {
          cancelUnregisteredPaymentRQ: { codeQR: messageId },
        },
      },
    },
  };

  const res = await fetch(
    `${env.NEQUI_API_URL}/payments/v2/-services-paymentservice-cancelunregisteredpayment`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-api-key': env.NEQUI_API_KEY,
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) throw new AppError('Error al cancelar pago en Nequi', 502);
  return { cancelled: true };
}

export { NEQUI_STATUS, isConfigured };
