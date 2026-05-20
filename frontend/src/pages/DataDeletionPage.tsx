import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';

export default function DataDeletionPage() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Por favor, ingresa tu correo electrónico.');
      return;
    }
    if (!consent) {
      setErrorMsg('Debes confirmar que comprendes los términos de la eliminación.');
      return;
    }

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const response = await apiClient.post<{ success: boolean; data: { message: string } }>(
        '/arco/public-deletion-request',
        { email, reason }
      );
      if (response.data.success) {
        setSuccessMsg(response.data.data.message || 'Tu solicitud ha sido registrada correctamente. Se iniciará el periodo de gracia de 30 días.');
        setEmail('');
        setReason('');
        setConsent(false);
      } else {
        setErrorMsg('No se pudo procesar la solicitud. Por favor intenta de nuevo.');
      }
    } catch (err: unknown) {
      const errorData = (err as { response?: { data?: { error?: string } } }).response?.data;
      if (errorData?.error) {
        setErrorMsg(errorData.error);
      } else {
        setErrorMsg('No encontramos un usuario registrado con este correo electrónico. Por favor verifica que esté bien escrito.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'inherit' }}>
      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#1a4731', letterSpacing: '1px' }}>CASPETE</span>
        </Link>
        <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          <Link to="/privacidad" style={{ color: '#6b7280' }}>Política de Privacidad</Link>
          <Link to="/condiciones" style={{ color: '#6b7280' }}>Condiciones del Servicio</Link>
          <Link to="/eliminacion-datos" style={{ color: '#1a4731', fontWeight: 600 }}>Eliminación de Datos</Link>
          <Link to="/derechos-datos" style={{ color: '#6b7280' }}>Derechos ARCO</Link>
        </div>
      </nav>

      <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 20px 60px' }}>
        {/* Encabezado */}
        <div style={{ background: 'linear-gradient(135deg, #1a4731 0%, #2d7a4f 100%)', borderRadius: 16, padding: '32px 36px', marginBottom: 32, color: '#fff', boxShadow: '0 4px 20px rgba(26, 71, 49, 0.08)' }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Derecho al Olvido · Cumplimiento RGPD & Ley 1581 de 2012</p>
          <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Eliminación de Datos del Usuario
          </h1>
          <p style={{ margin: 0, opacity: 0.85, fontSize: 14 }}>
            Esta página explica cómo solicitar la eliminación definitiva de tu cuenta y todos tus datos personales en la plataforma Caspete.
          </p>
        </div>

        {/* Info Box */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '16px 20px', marginBottom: 28, color: '#1e3a8a', fontSize: 14, lineHeight: 1.6 }}>
          💡 <strong>Importante para Auditores de Meta (App Review):</strong> Esta página es de acceso completamente público y permite a cualquier usuario iniciar de forma segura la solicitud de revocación y eliminación definitiva de sus credenciales, tokens, conexiones de WhatsApp Business y metadatos asociados a su cuenta, cumpliendo estrictamente con las directrices de la API de Meta y las normativas globales de privacidad (RGPD / GDPR y Ley 1581).
        </div>

        <Section title="1. ¿Qué datos eliminamos?">
          <p>Al ejercer tu derecho de supresión de datos, Caspete eliminará de forma definitiva, permanente e irreversible la siguiente información de nuestros servidores:</p>
          <ul>
            <li><strong>Datos de Conexión de WhatsApp Business:</strong> Tokens de acceso, identificadores de canal webhooks, y configuraciones de envío de plantillas.</li>
            <li><strong>Eventos y Mensajes:</strong> Historial completo de mensajes transmitidos, estados de entrega y logs temporales del canal de chat.</li>
            <li><strong>Metadatos Operativos:</strong> Información de perfil del usuario administrador (email, teléfono, nombre) e información del colegio/tienda asignada.</li>
            <li><strong>Billetera y Saldos:</strong> Transacciones históricas e identificadores de vinculación de recargas (los registros fiscales exigidos por la DIAN y la legislación colombiana se mantendrán archivados únicamente para fines legales antes de su purga final).</li>
          </ul>
        </Section>

        <Section title="2. ¿Cómo funciona el proceso de eliminación?">
          <ol style={{ paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}><strong>Registro de Solicitud:</strong> Ingresas tu correo electrónico en el formulario al final de esta página. Si coincide con una cuenta activa, el sistema registrará tu solicitud de eliminación de forma inmediata.</li>
            <li style={{ marginBottom: 8 }}><strong>Periodo de Gracia (30 Días):</strong> En cumplimiento de los derechos de protección de datos, aplicamos un plazo de seguridad de 30 días calendario por si decides revocar la decisión y recuperar el acceso a tu cuenta.</li>
            <li style={{ marginBottom: 8 }}><strong>Procesamiento Backend:</strong> Una vez finalizado el periodo de gracia, se ejecuta una función de API interna que borra de manera definitiva la información o la somete a un proceso de <strong>anonimización irreversible</strong> de acuerdo a las directrices de la SIC y el RGPD.</li>
            <li style={{ marginBottom: 8 }}><strong>Confirmación Final:</strong> Recibirás un correo electrónico de confirmación indicando la finalización exitosa del proceso de eliminación de datos de tu cuenta.</li>
          </ol>
        </Section>

        {/* Formulario */}
        <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Solicitar Eliminación Manual de Datos</h2>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px', lineHeight: 1.5 }}>
            Ingresa los datos solicitados a continuación para iniciar el proceso de eliminación. La solicitud será procesada de forma segura a través de nuestro flujo de auditoría interna de datos (ARCO).
          </p>

          {successMsg && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '16px', color: '#15803d', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
              ✓ <strong>¡Solicitud Registrada Exitosamente!</strong>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#166534' }}>{successMsg}</p>
            </div>
          )}

          {errorMsg && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '16px', color: '#b91c1c', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
              ⚠️ <strong>Error en el envío</strong>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#991b1b' }}>{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Correo electrónico registrado en la plataforma <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu-correo@ejemplo.com"
                style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#1a4731'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label htmlFor="reason" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Motivo de la solicitud (Opcional)
              </label>
              <textarea
                id="reason"
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ej. Ya no deseo utilizar el servicio de loncheras escolares o deseo revocar mis datos de WhatsApp"
                style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#1a4731'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  style={{ marginTop: 3, width: 16, height: 16, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5 }}>
                  Entiendo y acepto que el envío de esta solicitud iniciará el proceso de eliminación definitiva e irreversible de mi cuenta y de todos los datos asociados tras el periodo de gracia legal de 30 días de conformidad con la Ley 1581 de 2012. <span style={{ color: '#dc2626' }}>*</span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#93c5fd' : '#1a4731',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s, transform 0.1s',
                boxShadow: '0 4px 12px rgba(26, 71, 49, 0.15)',
              }}
              onMouseEnter={e => { if(!loading) e.currentTarget.style.backgroundColor = '#2d7a4f'; }}
              onMouseLeave={e => { if(!loading) e.currentTarget.style.backgroundColor = '#1a4731'; }}
            >
              {loading ? 'Procesando Solicitud...' : 'Enviar Solicitud de Eliminación'}
            </button>

            <p style={{ margin: '14px 0 0', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
              La solicitud se enviará de forma segura y encriptada a nuestro flujo interno de procesamiento ARCO.
            </p>
          </form>
        </section>

        {/* Footer */}
        <div style={{ background: '#f3f4f6', borderRadius: 10, padding: '16px 20px', marginTop: 32, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
          <p style={{ margin: 0 }}>
            Caspete.com — Versión 1.0 — Mayo 2026 ·{' '}
            <a href="mailto:privacidad@caspete.com" style={{ color: '#1a4731' }}>privacidad@caspete.com</a> ·{' '}
            Supervisado por la <a href="https://www.sic.gov.co" target="_blank" rel="noreferrer" style={{ color: '#1a4731' }}>SIC</a>
          </p>
          <div style={{ marginTop: 10, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/privacidad" style={{ color: '#6b7280', fontSize: 13 }}>🔒 Política de Privacidad</Link>
            <Link to="/condiciones" style={{ color: '#6b7280', fontSize: 13 }}>Condiciones del Servicio</Link>
            <Link to="/eliminacion-datos" style={{ color: '#1a4731', fontWeight: 600, fontSize: 13 }}>Eliminación de Datos</Link>
            <Link to="/register" style={{ color: '#6b7280', fontSize: 13 }}>Crear cuenta</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #e5e7eb' }}>{title}</h2>
      <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>{children}</div>
    </section>
  );
}
