import { Link } from 'react-router-dom';
import { ShieldCheck, Smile } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="bg-[#0c1c14] text-[#cbdcd0] py-16 border-t border-emerald-950 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">

        {/* Brand Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#fdf8f4] flex items-center justify-center p-1">
              <img src="/favicon.svg" alt="Kidway" className="w-full h-full" />
            </div>
            <span className="font-display font-black text-xl text-white tracking-tight">
              Kidway<span>🥦</span>
            </span>
          </div>
          <p className="text-xs text-[#cbdcd0] opacity-80 leading-relaxed">
            La plataforma colombiana pionera en la nutrición, control digital, saldos prepago y trazabilidad con QR seguro para colegios de Colombia.
          </p>
        </div>

        {/* Dynamic features links */}
        <div>
          <h5 className="text-xs font-black text-emerald-450 uppercase tracking-widest mb-4">Plataforma</h5>
          <div className="flex flex-col gap-3 text-xs">
            <Link to="/login" className="text-[#cbdcd0] opacity-80 hover:text-white transition-colors text-decoration-none font-bold">
              Iniciar sesión (Padres)
            </Link>
            <Link to="/register" className="text-[#cbdcd0] opacity-80 hover:text-white transition-colors text-decoration-none font-bold">
              Registrarse (Padres)
            </Link>
            <Link to="/login" className="text-[#cbdcd0] opacity-80 hover:text-white transition-colors text-decoration-none font-bold">
              Punto de Venta Cafetería (POS)
            </Link>
          </div>
        </div>

        {/* Legal references */}
        <div>
          <h5 className="text-xs font-black text-emerald-450 uppercase tracking-widest mb-4">Seguridad y Normativa</h5>
          <div className="flex flex-col gap-3 text-xs text-[#cbdcd0] opacity-80 font-bold">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-450" />
              <span>Ley 1581 (Habeas Data Menores)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Smile className="h-3.5 w-3.5 text-emerald-450" />
              <span>Ley 2120 (Alimentos Escolares)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Aprobación de menús por Nutricionistas</span>
            </div>
          </div>
        </div>

        {/* Contact note */}
        <div className="space-y-4">
          <h5 className="text-xs font-black text-emerald-450 uppercase tracking-widest">Contacto</h5>
          <p className="text-[11px] leading-relaxed text-[#cbdcd0] opacity-80">
            ¿Tienes alguna duda o quieres soporte directo en Colombia? Escríbenos a:
          </p>
          <div className="flex flex-col gap-1 text-[11px]">
            <a href="mailto:info@caspete.com" className="text-[#cbdcd0] hover:text-white text-decoration-none font-bold">info@caspete.com</a>
            <a href="mailto:privacidad@caspete.com" className="text-[#cbdcd0] hover:text-white text-decoration-none font-bold">privacidad@caspete.com</a>
            <a href="https://wa.me/573214364223" target="_blank" rel="noopener noreferrer" className="text-[#cbdcd0] hover:text-white text-decoration-none mt-1 font-bold">💬 WhatsApp: +57 321 436 4223</a>
          </div>
        </div>

      </div>

      {/* Small bottom text */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-emerald-950 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#cbdcd0] opacity-60">
        <span>&copy; {new Date().getFullYear()} Caspete S.A.S. Todos los derechos reservados. Colombia.</span>
        <div className="flex gap-4">
          <Link to="/privacy-policy" className="text-[#cbdcd0] hover:text-white text-decoration-none font-bold">Política de Privacidad</Link>
          <Link to="/condiciones" className="text-[#cbdcd0] hover:text-white text-decoration-none font-bold">Condiciones del Servicio</Link>
          <Link to="/eliminacion-datos" className="text-[#cbdcd0] hover:text-white text-decoration-none font-bold">Eliminación de Datos</Link>
        </div>
      </div>
    </footer>
  );
}
