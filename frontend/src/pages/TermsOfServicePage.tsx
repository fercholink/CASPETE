import { Link } from 'react-router-dom';

export default function TermsOfServicePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'inherit' }}>
      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#1a4731', letterSpacing: '1px' }}>CASPETE</span>
        </Link>
        <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          <Link to="/privacidad" style={{ color: '#6b7280' }}>Política de Privacidad</Link>
          <Link to="/condiciones" style={{ color: '#1a4731', fontWeight: 600 }}>Condiciones del Servicio</Link>
          <Link to="/eliminacion-datos" style={{ color: '#6b7280' }}>Eliminación de Datos</Link>
          <Link to="/cookies" style={{ color: '#6b7280' }}>Cookies</Link>
          <Link to="/derechos-datos" style={{ color: '#6b7280' }}>Derechos ARCO</Link>
        </div>
      </nav>

      <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 20px 60px' }}>
        {/* Encabezado */}
        <div style={{ background: 'linear-gradient(135deg, #1a4731 0%, #2d7a4f 100%)', borderRadius: 16, padding: '32px 36px', marginBottom: 32, color: '#fff' }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Términos de Uso · Acuerdo de Nivel de Servicio (SaaS)</p>
          <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Condiciones del Servicio
          </h1>
          <p style={{ margin: 0, opacity: 0.85, fontSize: 14 }}>
            Última actualización: Mayo 2026 · Válido para Colombia
          </p>
        </div>

        {/* Aviso de Acuerdo */}
        <div style={{ background: '#eff6ff', border: '1px solid #3b82f6', borderRadius: 10, padding: '14px 18px', marginBottom: 28 }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#1e3a8a' }}>
            ℹ️ <strong>Por favor, lee este acuerdo atentamente:</strong> Al registrarte, acceder o utilizar la plataforma
            Caspete (ya sea como Padre, Tendero, Admin de Colegio o Proveedor), aceptas cumplir y estar sujeto a las
            presentes Condiciones del Servicio y a nuestra Política de Privacidad de Datos.
          </p>
        </div>

        <Section title="1. Relación Contractual y Aceptación">
          <p>
            El presente documento constituye un contrato legalmente vinculante entre usted (en adelante, el "Usuario")
            y <strong>Caspete.com</strong> (representado por Ferney Blanco, NIT 1093752731-1), que regula el uso de la plataforma web,
            aplicaciones móviles, APIs y servicios de software de Caspete.
          </p>
          <p>
            Si el Usuario no está de acuerdo con estas condiciones, deberá abstenerse inmediatamente de registrarse,
            acceder o hacer uso de cualquiera de las herramientas y servicios de la plataforma.
          </p>
        </Section>

        <Section title="2. Descripción del Servicio (SaaS)">
          <p>
            Caspete es una plataforma SaaS (Software como Servicio) multi-tenant diseñada para optimizar y digitalizar
            la gestión de loncheras escolares en Colombia. Sus principales componentes incluyen:
          </p>
          <ul>
            <li><strong>Módulo de Padres:</strong> Permite programar loncheras, registrar alergias/restricciones de sus hijos, recargar saldo en la billetera virtual y monitorear el consumo nutricional.</li>
            <li><strong>Módulo de Tenderos/Proveedores:</strong> Facilita la recepción de pedidos del día en tiempo real, gestión de inventario, validación de entregas mediante códigos QR y comunicación interna.</li>
            <li><strong>Módulo de Colegio:</strong> Otorga a la institución herramientas de reportes nutricionales bajo la Ley 2120 de 2021, control financiero y auditoría general.</li>
          </ul>
        </Section>

        <Section title="3. Registro y Cuentas de Usuario">
          <p>
            Para acceder a las funcionalidades principales, el Usuario debe registrar una cuenta suministrando
            información veraz, completa y actualizada.
          </p>
          <ul>
            <li>El Usuario es el único responsable de la custodia y confidencialidad de sus credenciales de acceso.</li>
            <li>El acceso de los menores de edad a los alimentos proporcionados está estrictamente supeditado a que
            su padre, madre o tutor legal los registre y autorice expresamente el tratamiento de sus datos sensibles de salud.</li>
            <li>Caspete se reserva el derecho de suspender o cancelar cuentas que aporten datos falsos o hagan un uso
            indebido o delictivo de la plataforma.</li>
          </ul>
        </Section>

        <Section title="4. Billetera Digital, Pagos y Recargas">
          <p>
            Caspete facilita un sistema de billetera digital para simplificar las transacciones internas sin efectivo:
          </p>
          <ol>
            <li><strong>Recargas:</strong> Se realizan mediante integraciones con pasarelas de pago aliadas certificadas (ej: Nequi Push Payments, Wompi o transferencias aprobadas). Caspete no almacena datos de tarjetas de crédito o credenciales bancarias directas del Usuario.</li>
            <li><strong>Saldos y Reembolsos:</strong> El saldo recargado es de uso exclusivo para adquirir productos en las tiendas del colegio asociado. Cualquier solicitud de retiro o devolución del saldo inactivo se tramitará de acuerdo a las políticas financieras del colegio o escribiendo a soporte.</li>
            <li><strong>Comisiones:</strong> Caspete se reserva el derecho de cobrar tarifas de procesamiento por recarga, las cuales serán informadas al Usuario de manera transparente antes de confirmar cada transacción.</li>
          </ol>
        </Section>

        <Section title="5. Restricciones Alimentarias y Salud (Responsabilidad)">
          <p>
            ⚠️ <strong>Exclusión de Responsabilidad Nutricional y Médica:</strong> Caspete actúa como una herramienta
            de software para la transmisión de información. Aunque la plataforma permite registrar alergias y restricciones
            nutricionales del menor, la preparación física de los alimentos, la higiene y el estricto cumplimiento de las
            restricciones son responsabilidad directa y exclusiva del **Tendero / Concesionario de alimentos de la institución educativa**.
          </p>
          <p>
            Caspete no es un proveedor de alimentos ni un centro médico, y no se hace responsable por reacciones alérgicas
            o incidentes de salud que ocurran en el establecimiento escolar.
          </p>
        </Section>

        <Section title="6. Cumplimiento de la Ley 2120 de 2021 (Comida Chatarra)">
          <p>
            La plataforma incluye funcionalidades de etiquetado nutricional que clasifican los alimentos según la Resolución
            2492 de 2022 de Colombia. La veracidad de la información nutricional (sellos de advertencia de azúcares, sodio,
            grasas, etc.) cargada en el sistema depende enteramente de las fichas técnicas aportadas por los **Proveedores**
            y **Tenderos**. Caspete no asume responsabilidad si dichos terceros cargan información incorrecta o adulterada.
          </p>
        </Section>

        <Section title="7. Derechos de Propiedad Intelectual">
          <p>
            Todos los derechos de propiedad intelectual sobre el código fuente de la plataforma, diseño gráfico, logotipos,
            marcas comerciales, APIs, algoritmos y documentación de Caspete son propiedad exclusiva de Caspete.com SAS.
          </p>
          <p>
            El Usuario recibe una licencia de uso personal, no exclusiva, intransferible y revocable únicamente para interactuar
            con los servicios de software para las finalidades previstas en este contrato. Se prohíbe terminantemente la
            ingeniería inversa, descompilación o copia de cualquier fragmento de la tecnología de Caspete.
          </p>
        </Section>

        <Section title="8. Limitación de Responsabilidad">
          <p>
            Caspete se esfuerza por mantener una disponibilidad del servicio del 99.9% (Uptime). No obstante, el servicio
            se proporciona "tal cual" y "según disponibilidad". Caspete no garantiza que la plataforma esté libre de
            interrupciones temporales por mantenimiento, caídas de servidores externos de hosting, fallas de conectividad
            a internet de terceros o pasarelas de pago.
          </p>
        </Section>

        <Section title="9. Modificaciones y Ley Aplicable">
          <p>
            Nos reservamos el derecho de modificar o reemplazar estas Condiciones del Servicio en cualquier momento.
            Las modificaciones entrarán en vigor a los 15 días calendario de ser publicadas en la web.
          </p>
          <p>
            Estas condiciones se rigen e interpretan de conformidad con las leyes de la **República de Colombia**. Cualquier
            disputa relacionada se someterá ante la jurisdicción de los tribunales de Bogotá D.C.
          </p>
        </Section>

        {/* Footer */}
        <div style={{ background: '#f3f4f6', borderRadius: 10, padding: '16px 20px', marginTop: 32, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
          <p style={{ margin: 0 }}>
            Caspete.com — Versión 1.0 — Mayo 2026 ·{' '}
            <a href="mailto:info@caspete.com" style={{ color: '#1a4731' }}>info@caspete.com</a> ·{' '}
            Supervisado por la <a href="https://www.sic.gov.co" target="_blank" rel="noreferrer" style={{ color: '#1a4731' }}>SIC</a>
          </p>
          <div style={{ marginTop: 10, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/privacidad" style={{ color: '#6b7280', fontSize: 13 }}>🔒 Política de Privacidad</Link>
            <Link to="/condiciones" style={{ color: '#1a4731', fontWeight: 600, fontSize: 13 }}>Condiciones del Servicio</Link>
            <Link to="/eliminacion-datos" style={{ color: '#6b7280', fontSize: 13 }}>Eliminación de Datos</Link>
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
