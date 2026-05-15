/**
 * Job: Limpieza de tokens y OTPs expirados
 * ─────────────────────────────────────────
 * Ejecuta cada día a las 03:00 AM (hora Colombia).
 *
 * Limpia:
 * 1. RefreshTokens ya expirados o revocados hace más de 7 días
 * 2. PasswordResetTokens ya usados o expirados
 * 3. OTPs de pedidos expirados (otp_expires_at < ahora)
 */

import { prisma } from '../lib/prisma.js';

export async function runCleanupTokensJob(): Promise<void> {
  const label = '[CRON:cleanup-tokens]';
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now = new Date();

  console.log(`${label} Iniciando limpieza de tokens y OTPs expirados...`);

  try {
    // 1. Refresh tokens expirados o revocados hace más de 7 días
    const { count: deletedRefreshTokens } = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expires_at: { lt: sevenDaysAgo } },
          { revoked_at: { lt: sevenDaysAgo } },
        ],
      },
    });

    // 2. Password reset tokens usados o expirados
    const { count: deletedResetTokens } = await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { used_at: { not: null } },
          { expires_at: { lt: now } },
        ],
      },
    });

    // 3. OTPs de pedidos expirados — limpiar el código pero no el pedido
    const { count: clearedOtps } = await prisma.lunchOrder.updateMany({
      where: {
        otp_code: { not: null },
        otp_expires_at: { lt: now },
      },
      data: {
        otp_code: null,
        otp_expires_at: null,
      },
    });

    console.log(
      `${label} Completado — ` +
      `RefreshTokens eliminados: ${deletedRefreshTokens} | ` +
      `ResetTokens eliminados: ${deletedResetTokens} | ` +
      `OTPs limpiados: ${clearedOtps}`,
    );
  } catch (err) {
    console.error(`${label} Error en la limpieza:`, err);
  }
}
