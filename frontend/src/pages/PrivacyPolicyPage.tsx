import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'inherit' }}>
      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#1a4731', letterSpacing: '1px' }}>CASPETE</span>
        </Link>
        <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          <Link to="/privacidad" style={{ color: '#1a4731', fontWeight: 600 }}>Política de Privacidad</Link>
          <Link to="/cookies" style={{ color: '#6b7280' }}>Cookies</Link>
          <Link to="/derechos-datos" style={{ color: '#6b7280' }}>Derechos ARCO</Link>
        </div>
      </nav>

      <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 20px 60px' }}>
        {/* Encabezado */}
        <div style={{ background: 'linear-gradient(135deg, #1a4731 0%, #2d7a4f 100%)', borderRadius: 16, padding: '32px 36px', marginBottom: 32, color: '#fff' }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Ley 1581 de 2012 · Decreto 1377 de 2013</p>
          <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Política de Tratamiento de la Información
          </h1>
          <p style={{ margin: 0, opacity: 0.85, fontSize: 14 }}>
            Versión 1.0 — Mayo 2026 · Supervisado por la Superintendencia de Industria y Comercio (SIC)
          </p>
        </div>

        {/* Aviso crítico */}
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 10, padding: '14px 18px', marginBottom: 28 }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
            ⚠️ <strong>Datos de menores de edad:</strong> Caspete.com maneja datos sensibles de salud (alergias, restricciones
            médicas) de menores de edad en una categoría de <strong>máxima protección</strong>. El tratamiento se realiza exclusivamente
            bajo autorización expresa del representante legal y bajo el principio del Interés Superior del Niño.
          </p>
        </div>

        <Section title="1. Responsable del Tratamiento">
          <p><strong>Razón Social:</strong> Caspete.com SAS (en proceso de constitución)</p>
          <p><strong>NIT:</strong> En trámite</p>
          <p><strong>Correo:</strong> <a href="mailto:privacidad@caspete.com" style={{ color: '#1a4731' }}>privacidad@caspete.com</a></p>
          <p><strong>Canal ARCO:</strong> <a href="mailto:privacidad@caspete.com" style={{ color: '#1a4731' }}>privacidad@caspete.com</a> | Plazo: 15 días hábiles</p>
        </Section>

        <Section title="2. Datos que Recolectamos">
          <p><strong>2.1 Datos del padre/tutor legal (datos personales):</strong></p>
          <ul>
            <li>Nombre completo, número de cédula</li>
            <li>Correo electrónico, teléfono/WhatsApp</li>
            <li>Método de pago (procesado por pasarela PCI DSS — no almacenamos datos de tarjeta)</li>
          </ul>
          <p><strong>2.2 Datos del menor de edad (máxima protección):</strong></p>
          <ul>
            <li>Nombre y apellido, colegio, grado/curso</li>
            <li>Fecha de nacimiento (para adecuación nutricional)</li>
            <li><strong>Datos sensibles:</strong> Alergias alimentarias, restricciones médicas, condiciones nutricionales</li>
          </ul>
          <p><em>Principio de minimización (Art. 4): solo recolectamos datos indispensables para la prestación del servicio.</em></p>
        </Section>

        <Section title="3. Finalidades del Tratamiento">
          <ol>
            <li>Gestión y personalización de loncheras escolares</li>
            <li>Garantía de seguridad alimentaria del menor (alergias/restricciones)</li>
            <li>Procesamiento de pagos y recarga de billetera digital</li>
            <li>Comunicaciones operativas (confirmaciones de entrega, notificaciones)</li>
            <li>Cumplimiento regulatorio Ley 2120/2021 (sellos nutricionales)</li>
            <li>Análisis estadístico anónimo para mejora del servicio (solo con autorización)</li>
          </ol>
          <p>⛔ <strong>No usamos datos de menores con finalidades comerciales o publicitarias.</strong></p>
        </Section>

        <Section title="4. Derechos de los Titulares (Derechos ARCO)">
          <p>Los padres/tutores, en representación de sus hijos, tienen los siguientes derechos:</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={thStyle}>Derecho</th>
                <th style={thStyle}>Descripción</th>
                <th style={thStyle}>Plazo</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Acceso', 'Ver todos sus datos y los de su hijo en formato descargable.', '10 días hábiles'],
                ['Rectificación', 'Corregir datos inexactos o incompletos.', '15 días hábiles'],
                ['Cancelación', 'Solicitar la eliminación o anonimización de sus datos.', '15 días hábiles + 30 días de gracia'],
                ['Oposición', 'Oponerse a usos específicos (análisis, marketing).', 'Inmediato (toggles en plataforma)'],
                ['Revocatoria', 'Revocar la autorización de datos sensibles de salud.', '15 días hábiles'],
              ].map(([d, desc, p]) => (
                <tr key={d} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={tdStyle}><strong>{d}</strong></td>
                  <td style={tdStyle}>{desc}</td>
                  <td style={tdStyle}>{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: 14 }}>
            Ejerce tus derechos en la plataforma: <Link to="/mis-datos" style={{ color: '#1a4731', fontWeight: 600 }}>Mis Datos →</Link>{' '}
            o escribiendo a <a href="mailto:privacidad@caspete.com" style={{ color: '#1a4731' }}>privacidad@caspete.com</a>
          </p>
        </Section>

        <Section title="5. Consentimiento para Datos Sensibles (Art. 7)">
          <p>
            Por tratarse de datos sensibles de salud de menores de edad, Caspete.com obtiene{' '}
            <strong>consentimiento expreso, previo e informado</strong> en tres capas independientes durante el registro:
          </p>
          <ol>
            <li><strong>Autorización general</strong> de tratamiento de datos personales</li>
            <li><strong>Autorización reforzada</strong> para datos sensibles de salud del menor</li>
            <li><strong>Declaración de representación legal</strong> del menor</li>
          </ol>
          <p>Ningún checkbox está pre-marcado. El registro no se completa sin las tres aceptaciones.</p>
        </Section>

        <Section title="6. Transmisión de Datos a Terceros (Art. 25)">
          <p>Caspete.com comparte datos únicamente con:</p>
          <ul>
            <li><strong>Pasarela de pagos (Wompi/PayU):</strong> Datos financieros del tutor. Certificación PCI DSS.</li>
            <li><strong>Proveedor de hosting:</strong> Todos los datos almacenados bajo contrato DPA.</li>
            <li><strong>Colegios aliados:</strong> Datos de entrega bajo convenio de confidencialidad.</li>
          </ul>
          <p>⛔ No vendemos ni cedemos datos a terceros para fines publicitarios.</p>
        </Section>

        <Section title="7. Seguridad de la Información">
          <ul>
            <li>Comunicaciones cifradas con TLS 1.2+</li>
            <li>Datos sensibles de salud almacenados con cifrado en reposo</li>
            <li>Control de acceso por roles (RBAC): cada funcionario solo ve los datos necesarios para su función</li>
            <li>Registro de auditoría de toda operación sobre datos personales (Accountability — Circular 002 SIC)</li>
            <li>Protocolo de respuesta a incidentes con notificación a la SIC en máximo 72 horas</li>
          </ul>
        </Section>

        <Section title="8. Retención y Eliminación de Datos">
          <p>
            Los datos se conservan durante la vigencia de la relación contractual y por el tiempo exigido
            por obligaciones legales (facturación, registros tributarios). Al terminar el servicio:
          </p>
          <ol>
            <li>El padre/tutor solicita la eliminación a través de la plataforma o por correo</li>
            <li>El sistema aplica un período de gracia de 30 días</li>
            <li>Transcurrido el período, los datos son <strong>anonimizados</strong> irreversiblemente</li>
            <li>Se emite confirmación al titular</li>
          </ol>
          <p>⛔ No conservamos datos de menores "por si acaso". La retención sin finalidad activa es ilegal (Art. 4 Ley 1581).</p>
        </Section>

        <Section title="9. Modificaciones a esta Política">
          <p>
            Cualquier modificación sustancial será notificada al titular por correo electrónico con al menos
            15 días de anticipación. La versión vigente siempre estará disponible en{' '}
            <strong>caspete.com/privacidad</strong>.
          </p>
        </Section>

        {/* Footer */}
        <div style={{ background: '#f3f4f6', borderRadius: 10, padding: '16px 20px', marginTop: 32, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
          <p style={{ margin: 0 }}>
            Caspete.com — Versión 1.0 — Mayo 2026 ·{' '}
            <a href="mailto:privacidad@caspete.com" style={{ color: '#1a4731' }}>privacidad@caspete.com</a> ·{' '}
            Supervisado por la <a href="https://www.sic.gov.co" target="_blank" rel="noreferrer" style={{ color: '#1a4731' }}>SIC</a>
          </p>
          <div style={{ marginTop: 10, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/mis-datos" style={{ color: '#1a4731', fontWeight: 600, fontSize: 13 }}>🔒 Mis Datos (ARCO)</Link>
            <Link to="/cookies" style={{ color: '#6b7280', fontSize: 13 }}>Política de Cookies</Link>
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

const thStyle: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: '#6b7280', border: '1px solid #e5e7eb' };
const tdStyle: React.CSSProperties = { padding: '8px 12px', fontSize: 13, border: '1px solid #e5e7eb', verticalAlign: 'top' };
