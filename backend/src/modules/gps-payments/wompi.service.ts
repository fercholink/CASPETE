import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import { getGpsGlobalPricing } from '../gps/gps-pricing.service.js';

export interface WompiCheckoutData {
  publicKey: string;
  currency: 'COP';
  amountInCents: number;
  reference: string;
  signatureIntegrity: string;
  redirectUrl: string;
  expirationTime?: string;
  customerData?: {
    email?: string | undefined;
    fullName?: string | undefined;
  };
}

export async function createWompiCheckoutSession(
  trackerId: string,
  actor: JwtPayload,
): Promise<WompiCheckoutData> {
  const tracker = await prisma.gPSTracker.findUnique({
    where: { id: trackerId },
    select: {
      id: true, device_name: true,
      included_guardians: true, custom_monthly_price: true, custom_guardian_price: true,
      student: { select: { id: true, parent_id: true, full_name: true, parent: { select: { email: true, full_name: true } } } },
    },
  });

  if (!tracker) throw new AppError('Localizador no encontrado', 404);
  if (actor.role !== 'SUPER_ADMIN' && tracker.student?.parent_id !== actor.sub) {
    throw new AppError('No tienes permiso sobre este localizador', 403);
  }

  const globalPricing = await getGpsGlobalPricing();
  const basePrice = tracker.custom_monthly_price ? Number(tracker.custom_monthly_price) : globalPricing.monthly_price;
  const extraPrice = tracker.custom_guardian_price ? Number(tracker.custom_guardian_price) : globalPricing.extra_guardian_price;
  const includedCount = tracker.included_guardians ?? globalPricing.included_guardians;

  const activeGuardiansCount = tracker.student?.id
    ? await prisma.studentGuardian.count({ where: { student_id: tracker.student.id, active: true } })
    : 0;

  const extraGuardians = Math.max(0, activeGuardiansCount - includedCount);
  const totalAmount = basePrice + (extraGuardians * extraPrice);
  const amountInCents = Math.round(totalAmount * 100);

  // Referencia única y rastreable
  const reference = `GPS-${tracker.id.slice(-6)}-${Date.now()}`;

  // Firma de integridad SHA-256 requerida por el Widget / Checkout de Wompi
  // Formato oficial: "<Referencia><MontoEnCentavos><Moneda><IntegritySecret>"
  const integritySecret = env.WOMPI_INTEGRITY_SECRET || '';
  const rawSignature = `${reference}${amountInCents}COP${integritySecret}`;
  const signatureIntegrity = crypto.createHash('sha256').update(rawSignature).digest('hex');

  // Guardamos la solicitud en estado PENDING para rastrear la sesión de pago
  await prisma.gPSPaymentRequest.create({
    data: {
      tracker_id: tracker.id,
      parent_id: actor.sub,
      type: 'MONTHLY_SUBSCRIPTION',
      amount: totalAmount,
      receipt_url: 'wompi_gateway',
      payment_reference: reference,
      status: 'PENDING',
    },
  });

  const redirectUrl = `${env.FRONTEND_URL}/dashboard?gps_payment_ref=${reference}`;

  return {
    publicKey: env.WOMPI_PUBLIC_KEY,
    currency: 'COP',
    amountInCents,
    reference,
    signatureIntegrity,
    redirectUrl,
    customerData: {
      email: tracker.student?.parent?.email,
      fullName: tracker.student?.parent?.full_name,
    },
  };
}

/**
 * Valida la firma del webhook de Wompi
 * Wompi envía checksum calculado sobre las propiedades indicadas en signature.properties + timestamp + eventsSecret
 */
function verifyWompiChecksum(body: any): boolean {
  if (!env.WOMPI_EVENTS_SECRET) {
    // Si no hay secret configurado en desarrollo, permitimos procesar con log de advertencia
    console.warn('[Wompi Webhook] WOMPI_EVENTS_SECRET no configurado, omitiendo validación de firma en desarrollo');
    return true;
  }

  const { data, signature, timestamp } = body || {};
  if (!signature || !signature.checksum || !Array.isArray(signature.properties)) {
    return false;
  }

  try {
    let concatenated = '';
    for (const propPath of signature.properties) {
      const parts = propPath.split('.');
      let val: any = data;
      for (const p of parts) {
        val = val?.[p];
      }
      concatenated += val !== undefined && val !== null ? String(val) : '';
    }
    concatenated += String(timestamp);
    concatenated += env.WOMPI_EVENTS_SECRET;

    const computed = crypto.createHash('sha256').update(concatenated).digest('hex');
    return computed.toLowerCase() === String(signature.checksum).toLowerCase();
  } catch (err) {
    console.error('[Wompi Webhook] Error al validar firma:', err);
    return false;
  }
}

/**
 * Procesa el webhook oficial de Wompi cuando una transacción cambia de estado
 */
export async function handleWompiWebhook(body: any) {
  const isValid = verifyWompiChecksum(body);
  if (!isValid) {
    throw new AppError('Firma de webhook de Wompi inválida', 400);
  }

  const transaction = body?.data?.transaction;
  if (!transaction) {
    return { received: true, ignored: true };
  }

  const { reference, status, id: transactionId } = transaction;
  console.log(`[Wompi Webhook] Evento recibido para ref: ${reference}, status: ${status}, txId: ${transactionId}`);

  if (!reference) return { received: true, ignored: true };

  const paymentRequest = await prisma.gPSPaymentRequest.findFirst({
    where: { payment_reference: reference },
    include: { tracker: true },
  });

  if (!paymentRequest) {
    console.warn(`[Wompi Webhook] No se encontró GPSPaymentRequest para la referencia ${reference}`);
    return { received: true, not_found: true };
  }

  if (paymentRequest.status === 'APPROVED') {
    return { received: true, already_approved: true };
  }

  if (status === 'APPROVED') {
    await prisma.$transaction(async (tx) => {
      const now = new Date();
      const baseDate = paymentRequest.tracker.subscription_paid_until && paymentRequest.tracker.subscription_paid_until > now
        ? paymentRequest.tracker.subscription_paid_until
        : now;
      const periodEnd = new Date(baseDate);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await tx.gPSTracker.update({
        where: { id: paymentRequest.tracker_id },
        data: { subscription_paid_until: periodEnd },
      });

      await tx.gPSPaymentRequest.update({
        where: { id: paymentRequest.id },
        data: {
          status: 'APPROVED',
          period_end: periodEnd,
          receipt_url: `wompi:${transactionId || reference}`,
        },
      });
    });

    console.log(`[Wompi Webhook] Pago APROBADO para localizador ${paymentRequest.tracker_id}. Suscripción renovada con éxito.`);
    return { received: true, approved: true };
  }

  if (status === 'DECLINED' || status === 'ERROR') {
    await prisma.gPSPaymentRequest.update({
      where: { id: paymentRequest.id },
      data: { status: 'REJECTED' },
    });
    return { received: true, rejected: true };
  }

  return { received: true, status };
}

/**
 * Consulta el estado de una referencia Wompi (útil para cuando el usuario regresa al frontend tras el pago)
 */
export async function checkWompiPaymentStatus(reference: string, actor: JwtPayload) {
  const paymentRequest = await prisma.gPSPaymentRequest.findFirst({
    where: { payment_reference: reference },
    select: {
      id: true, tracker_id: true, parent_id: true, status: true, amount: true, period_end: true,
      tracker: { select: { id: true, device_name: true, subscription_paid_until: true } },
    },
  });

  if (!paymentRequest) throw new AppError('Pago no encontrado', 404);
  if (actor.role !== 'SUPER_ADMIN' && paymentRequest.parent_id !== actor.sub) {
    throw new AppError('No tienes permiso para ver este pago', 403);
  }

  return paymentRequest;
}
