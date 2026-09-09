import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = new Resend(env.RESEND_API_KEY);

function fmtCOP(v: number) {
  return `$${v.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  if (env.RESEND_API_KEY === 'mock_key' || !env.RESEND_API_KEY || env.RESEND_API_KEY.startsWith('mock_')) {
    console.log('\n🔑 [MOCK EMAIL] Enlace de recuperación de contraseña enviado a:', to);
    console.log('👤 Nombre:', name);
    console.log('🔗 Enlace:', resetUrl);
    console.log('--------------------------------------------------\n');
    return;
  }

  await resend.emails.send({
    from: `Kidway <${env.EMAIL_FROM}>`,
    to,
    subject: '🔑 Recupera tu contraseña de Kidway',
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Recuperar contraseña - Kidway</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        
        <!-- Header -->
        <tr><td style="background-color:#1a4731;background:linear-gradient(135deg,#1a4731,#2d6a4f);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">🎒</div>
          <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:1px;">KIDWAY</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:0.5px;text-transform:uppercase;margin-top:4px;">Loncheras Escolares Inteligentes</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">Hola, ${name} 👋</h1>
          <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta de Kidway.<br/>
            Si no fuiste tú, puedes ignorar este correo tranquilamente.
          </p>

          <!-- Botón -->
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="display:inline-block;background-color:#1a4731;background:linear-gradient(135deg,#1a4731,#2d6a4f);color:#fff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
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
            © ${new Date().getFullYear()} Kidway · Loncheras Escolares Inteligentes<br/>
            <a href="https://kidway.co" style="color:#1a4731;">kidway.co</a>
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
  if (env.RESEND_API_KEY === 'mock_key' || !env.RESEND_API_KEY || env.RESEND_API_KEY.startsWith('mock_')) {
    console.log('\n✅ [MOCK EMAIL] Recarga confirmada para:', to);
    console.log('👤 Padre:', parentName, 'Estudiante:', studentName);
    console.log('💰 Monto:', amount, 'Saldo:', newBalance);
    console.log('--------------------------------------------------\n');
    return;
  }

  const methodLabel: Record<string, string> = {
    NEQUI: 'Nequi',
    BANCOLOMBIA: 'Bancolombia',
    DAVIVIENDA: 'Davivienda',
    TRANSFERENCIA: 'Transferencia bancaria',
  };

  await resend.emails.send({
    from: `Kidway <${env.EMAIL_FROM}>`,
    to,
    subject: `✅ Recarga confirmada — ${fmtCOP(amount)} para ${studentName}`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Recarga confirmada - Kidway</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <tr><td style="background-color:#1a4731;background:linear-gradient(135deg,#1a4731,#2d6a4f);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">🎒</div>
          <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:1px;">KIDWAY</div>
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
            Ya puedes realizar pedidos para tu hijo/a desde la plataforma Kidway.
          </p>
        </td></tr>

        <tr><td style="padding:24px 0;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            © ${new Date().getFullYear()} Kidway · Loncheras Escolares Inteligentes<br/>
            <a href="https://kidway.co" style="color:#1a4731;">kidway.co</a>
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

export async function sendTopupRejectionEmail(
  to: string,
  parentName: string,
  studentName: string,
  amount: number,
) {
  if (env.RESEND_API_KEY === 'mock_key' || !env.RESEND_API_KEY || env.RESEND_API_KEY.startsWith('mock_')) {
    console.log('\n❌ [MOCK EMAIL] Recarga rechazada para:', to);
    console.log('👤 Padre:', parentName, 'Estudiante:', studentName);
    console.log('💰 Monto:', amount);
    console.log('--------------------------------------------------\n');
    return;
  }

  await resend.emails.send({
    from: `Kidway <${env.EMAIL_FROM}>`,
    to,
    subject: `❌ Solicitud de recarga no aprobada — ${fmtCOP(amount)} para ${studentName}`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Recarga no aprobada - Kidway</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <tr><td style="background-color:#1a4731;background:linear-gradient(135deg,#1a4731,#2d6a4f);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">🎒</div>
          <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:1px;">KIDWAY</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:0.5px;text-transform:uppercase;margin-top:4px;">Loncheras Escolares Inteligentes</div>
        </td></tr>

        <tr><td style="background:#ffffff;padding:40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">Hola, ${parentName} 👋</h1>
          <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Tu solicitud de recarga de <strong>${fmtCOP(amount)}</strong> para <strong>${studentName}</strong> no pudo ser aprobada en esta ocasión.
          </p>

          <div style="background:#fff5f5;border-left:4px solid #e53e3e;border-radius:4px;padding:16px;margin:24px 0;">
            <p style="color:#742a2a;font-size:14px;margin:0;">
              ⚠️ Si crees que esto es un error o tienes preguntas, por favor comunícate con la administración del colegio o escríbenos a <a href="mailto:info@kidway.co" style="color:#1a4731;">info@kidway.co</a>.
            </p>
          </div>

          <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:24px 0 0;">
            Puedes realizar una nueva solicitud de recarga desde la plataforma Kidway cuando lo desees.
          </p>
        </td></tr>

        <tr><td style="padding:24px 0;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            © ${new Date().getFullYear()} Kidway · Loncheras Escolares Inteligentes<br/>
            <a href="https://kidway.co" style="color:#1a4731;">kidway.co</a>
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

export async function sendEmailVerificationEmail(to: string, name: string, verificationUrl: string) {
  if (env.RESEND_API_KEY === 'mock_key' || !env.RESEND_API_KEY || env.RESEND_API_KEY.startsWith('mock_')) {
    console.log('\n✉️  [MOCK EMAIL] Enlace de verificación de correo enviado a:', to);
    console.log('👤 Nombre:', name);
    console.log('🔗 Enlace:', verificationUrl);
    console.log('--------------------------------------------------\n');
    return;
  }

  await resend.emails.send({
    from: `Kidway <${env.EMAIL_FROM}>`,
    to,
    subject: '📧 Confirma tu correo electrónico en Kidway',
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Confirmar correo electrónico - Kidway</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        
        <!-- Header -->
        <tr><td style="background-color:#1a4731;background:linear-gradient(135deg,#1a4731,#2d6a4f);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">🎒</div>
          <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:1px;">KIDWAY</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:0.5px;text-transform:uppercase;margin-top:4px;">Loncheras Escolares Inteligentes</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">¡Bienvenido/a, ${name}! 👋</h1>
          <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Gracias por registrarte en Kidway. Para comenzar a programar las loncheras escolares de tus hijos de forma inteligente y segura, por favor confirma tu dirección de correo electrónico.
          </p>

          <!-- Botón -->
          <div style="text-align:center;margin:32px 0;">
            <a href="${verificationUrl}" style="display:inline-block;background-color:#1a4731;background:linear-gradient(135deg,#1a4731,#2d6a4f);color:#fff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
              📧 Confirmar correo electrónico
            </a>
          </div>

          <!-- Aviso de expiración -->
          <div style="background:#f9fafb;border-left:4px solid #1a4731;border-radius:4px;padding:14px 16px;margin:24px 0;">
            <p style="color:#374151;font-size:13px;margin:0;">
              ⏰ <strong>Este enlace expira en 24 horas</strong> por razones de seguridad.
            </p>
          </div>

          <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:24px 0 0;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
            <a href="${verificationUrl}" style="color:#1a4731;word-break:break-all;">${verificationUrl}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            © ${new Date().getFullYear()} Kidway · Loncheras Escolares Inteligentes<br/>
            <a href="https://kidway.co" style="color:#1a4731;">kidway.co</a>
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

export async function sendGuardianInvitationEmail(
  to: string,
  parentName: string,
  studentName: string,
  relationshipLabel: string,
  registerUrl: string,
) {
  if (env.RESEND_API_KEY === 'mock_key' || !env.RESEND_API_KEY || env.RESEND_API_KEY.startsWith('mock_')) {
    console.log('\n👨‍👩‍👦 [MOCK EMAIL] Invitación a Círculo Familiar enviada a:', to);
    console.log('👤 Invitado por:', parentName);
    console.log('🎒 Estudiante:', studentName);
    console.log('❤️ Parentesco:', relationshipLabel);
    console.log('🔗 Enlace para registrarse:', registerUrl);
    console.log('--------------------------------------------------\n');
    return;
  }

  await resend.emails.send({
    from: `Kidway <${env.EMAIL_FROM}>`,
    to,
    subject: `📍 ${parentName} te invitó a seguir la ubicación de ${studentName} en Kidway`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Invitación a Círculo Familiar - Kidway</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        
        <!-- Header -->
        <tr><td style="background-color:#1a4731;background:linear-gradient(135deg,#1a4731,#2d6a4f);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">📍</div>
          <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:1px;">KIDWAY</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:0.5px;text-transform:uppercase;margin-top:4px;">Círculo de Confianza y Seguridad Escolar</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 12px;">¡Hola! 👋</h1>
          <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 20px;">
            <strong>${parentName}</strong> te ha invitado a unirte como <strong>${relationshipLabel}</strong> al círculo de confianza de <strong>${studentName}</strong> en Kidway.
          </p>

          <!-- Tarjeta de Beneficios -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1a4731;text-transform:uppercase;letter-spacing:0.5px;">Con tu cuenta podrás:</p>
            <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:1.7;">
              <li>Ver la <strong>ubicación en tiempo real</strong> de ${studentName} durante sus trayectos.</li>
              <li>Recibir <strong>alertas inmediatas</strong> cuando llegue o salga del colegio.</li>
              <li>Consultar el historial de rutas y el estado de batería de su localizador.</li>
            </ul>
          </div>

          <!-- Botón de Registro -->
          <div style="text-align:center;margin:32px 0;">
            <a href="${registerUrl}" style="display:inline-block;background-color:#1a4731;background:linear-gradient(135deg,#1a4731,#2d6a4f);color:#fff;font-size:16px;font-weight:600;text-decoration:none;padding:15px 36px;border-radius:10px;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(26,71,49,0.25);">
              🚀 Aceptar invitación y crear cuenta
            </a>
          </div>

          <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:4px;padding:12px 16px;margin:24px 0;">
            <p style="color:#166534;font-size:13px;margin:0;">
              ✨ <strong>Es gratis para ti:</strong> Al registrarte con este correo, el estudiante aparecerá automáticamente en tu mapa sin que tengas que configurar nada.
            </p>
          </div>

          <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:24px 0 0;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
            <a href="${registerUrl}" style="color:#1a4731;word-break:break-all;">${registerUrl}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            © ${new Date().getFullYear()} Kidway · Seguridad y Loncheras Escolares<br/>
            <a href="https://kidway.co" style="color:#1a4731;">kidway.co</a>
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

export async function sendDemoInvitationEmail(
  to: string,
  contactName: string,
  schoolName: string,
  demoUrl: string,
) {
  if (env.RESEND_API_KEY === 'mock_key' || !env.RESEND_API_KEY || env.RESEND_API_KEY.startsWith('mock_')) {
    console.log('\n🚀 [MOCK EMAIL] Invitación de demo enviada a:', to);
    console.log('👤 Rector:', contactName);
    console.log('🏫 Colegio:', schoolName);
    console.log('🔗 Enlace demo:', demoUrl);
    console.log('--------------------------------------------------\n');
    return;
  }

  await resend.emails.send({
    from: `Kidway <${env.EMAIL_FROM}>`,
    to,
    subject: `🎉 ¡Tu demo de Kidway está lista, ${contactName}!`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Demo lista - Kidway</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr><td style="background-color:#1a4731;background:linear-gradient(135deg,#1a4731,#2d6a4f);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">🎒</div>
          <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:1px;">KIDWAY</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:0.5px;text-transform:uppercase;margin-top:4px;">Loncheras Escolares Inteligentes</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Celebration banner -->
          <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #86efac;border-radius:12px;padding:20px 24px;margin-bottom:28px;text-align:center;">
            <div style="font-size:40px;margin-bottom:8px;">🚀</div>
            <div style="font-size:18px;font-weight:700;color:#15803d;">¡Tu demo está activada!</div>
            <div style="font-size:13px;color:#166534;margin-top:4px;">${schoolName}</div>
          </div>

          <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 12px;">Hola, ${contactName} 👋</h1>
          <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px;">
            Estamos emocionados de tenerte en Kidway. Hemos activado tu acceso para que configures el sistema de tu colegio.<br/>
            Con tu cuenta podrás agregar docentes, tenderos y gestionar todo desde el panel administrativo.
          </p>

          <!-- Steps -->
          <div style="margin:0 0 28px;">
            <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:14px;text-transform:uppercase;letter-spacing:0.05em;">¿Qué puedes hacer?</div>
            <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
              <div style="font-size:18px;min-width:28px;">👨‍💼</div>
              <div style="font-size:14px;color:#374151;line-height:1.5;">Crear tu cuenta de administrador del colegio</div>
            </div>
            <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
              <div style="font-size:18px;min-width:28px;">🍱</div>
              <div style="font-size:14px;color:#374151;line-height:1.5;">Configurar las tiendas y el menú escolar</div>
            </div>
            <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
              <div style="font-size:18px;min-width:28px;">📚</div>
              <div style="font-size:14px;color:#374151;line-height:1.5;">Agregar cursos, docentes y estudiantes</div>
            </div>
            <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
              <div style="font-size:18px;min-width:28px;">👨‍👩‍👦</div>
              <div style="font-size:14px;color:#374151;line-height:1.5;">Los padres podrán registrarse y hacer pedidos</div>
            </div>
          </div>

          <!-- CTA Button -->
          <div style="text-align:center;margin:32px 0;">
            <a href="${demoUrl}" style="display:inline-block;background-color:#1a4731;background:linear-gradient(135deg,#1a4731,#2d6a4f);color:#fff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(26,71,49,0.4);">
              🏫 Configurar mi colegio
            </a>
          </div>

          <!-- TTL warning -->
          <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;padding:14px 16px;margin:24px 0;">
            <p style="color:#92400e;font-size:13px;margin:0;">
              ⏰ <strong>Este enlace expira en 7 días.</strong> Si tienes problemas para acceder, responde a este correo y te ayudamos.
            </p>
          </div>

          <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:24px 0 0;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
            <a href="${demoUrl}" style="color:#1a4731;word-break:break-all;">${demoUrl}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            © ${new Date().getFullYear()} Kidway · Loncheras Escolares Inteligentes<br/>
            <a href="https://kidway.co" style="color:#1a4731;">kidway.co</a>
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
