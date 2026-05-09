import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = new Resend(env.RESEND_API_KEY);

function fmtCOP(v: number) {
  return `$${v.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  await resend.emails.send({
    from: `Caspete <${env.EMAIL_FROM}>`,
    to,
    subject: '🔑 Recupera tu contraseña de Caspete',
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Recuperar contraseña - Caspete</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1a4731,#2d6a4f);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">🎒</div>
          <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:1px;">CASPETE</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:0.5px;text-transform:uppercase;margin-top:4px;">Loncheras Escolares Inteligentes</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">Hola, ${name} 👋</h1>
          <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta de Caspete.<br/>
            Si no fuiste tú, puedes ignorar este correo tranquilamente.
          </p>

          <!-- Botón -->
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#1a4731,#2d6a4f);color:#fff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
              🔑 Restablecer mi contraseña
            </a>
          </div>

          <!-- Aviso de expiración -->
          <div style="background:#f9fafb;border-left:4px solid #1a4731;border-radius:4px;padding:14px 16px;margin:24px 0;">
            <p style="color:#374151;font-size:13px;margin:0;">
              ⏰ <strong>Este enlace expira en 1 hora</strong> por razones de seguridad.
            </p>
          </div>

          <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:24px 0 0;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
            <a href="${resetUrl}" style="color:#1a4731;word-break:break-all;">${resetUrl}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            © ${new Date().getFullYear()} Caspete · Loncheras Escolares Inteligentes<br/>
            <a href="https://caspete.com" style="color:#1a4731;">caspete.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  });
}

export async function sendTopupConfirmationEmail(
  to: string,
  parentName: string,
  studentName: string,
  amount: number,
  newBalance: number,
  paymentMethod: string,
) {
  const methodLabel: Record<string, string> = {
    NEQUI: 'Nequi',
    BANCOLOMBIA: 'Bancolombia',
    DAVIVIENDA: 'Davivienda',
  };

  await resend.emails.send({
    from: `Caspete <${env.EMAIL_FROM}>`,
    to,
    subject: `✅ Recarga confirmada — ${fmtCOP(amount)} para ${studentName}`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Recarga confirmada - Caspete</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <tr><td style="background:linear-gradient(135deg,#1a4731,#2d6a4f);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">🎒</div>
          <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:1px;">CASPETE</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:0.5px;text-transform:uppercase;margin-top:4px;">Loncheras Escolares Inteligentes</div>
        </td></tr>

        <tr><td style="background:#ffffff;padding:40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">Hola, ${parentName} 👋</h1>
          <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Tu recarga fue confirmada y el saldo de <strong>${studentName}</strong> ha sido actualizado.
          </p>

          <div style="background:#f0f9f4;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Monto recargado</p>
            <p style="margin:0 0 16px;font-size:36px;font-weight:800;color:#1a4731;font-family:monospace;">${fmtCOP(amount)}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Nuevo saldo disponible</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:#2d6a4f;font-family:monospace;">${fmtCOP(newBalance)}</p>
          </div>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Estudiante</td>
              <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600;color:#111827;font-size:14px;">${studentName}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;font-size:14px;">Método de pago</td>
              <td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;font-size:14px;">${methodLabel[paymentMethod] ?? paymentMethod}</td>
            </tr>
          </table>

          <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:24px 0 0;">
            Ya puedes realizar pedidos para tu hijo/a desde la plataforma Caspete.
          </p>
        </td></tr>

        <tr><td style="padding:24px 0;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            © ${new Date().getFullYear()} Caspete · Loncheras Escolares Inteligentes<br/>
            <a href="https://caspete.com" style="color:#1a4731;">caspete.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  });
}
