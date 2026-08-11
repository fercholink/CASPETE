import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { to: '/', label: '🥦 Inicio' },
  { to: '/beneficios', label: 'Nuestros Beneficios' },
  { to: '/funcionalidades', label: 'Funcionalidades' },
  { to: '/funcionalidades#precios', label: 'Precios' },
];

export default function LandingHeader() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Dynamic Floating Global Notification Bar - Healthy Green / Sano theme */}
      <div className="bg-emerald-50 text-emerald-800 py-3 px-4 text-center text-xs font-bold flex items-center justify-center gap-2 select-none border-b border-emerald-200">
        <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black animate-pulse flex items-center gap-0.5">
          <Heart className="h-2.5 w-2.5 fill-current text-white" /> NUEVO
        </span>
        <span>📍 Ubicación GPS en tiempo real y 📞 llamadas directas con tu hijo desde su localizador. ¡Y también sus loncheras, todo en una app! 🎒</span>
      </div>

      {/* Styled Responsive Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#fffaf5]/95 backdrop-blur-md border-b border-[#faeae1] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex justify-between items-center text-left">

          {/* Logo Brand Accent — mochila Kidway */}
          <Link to="/" className="flex items-center gap-2.5 focus:outline-none cursor-pointer group text-decoration-none">
            <div className="w-11 h-11 flex items-center justify-center group-hover:scale-105 transition-all">
              <img src="/favicon.svg" alt="Kidway" className="w-full h-full drop-shadow-sm" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-display font-black text-2xl tracking-tight text-emerald-600 group-hover:text-emerald-500 transition-colors">
                  Kidway
                </span>
                <span className="text-2xl font-bold text-emerald-500">📞</span>
              </div>
              <span className="text-[10px] text-[#8c6d71] font-bold block leading-none tracking-wide uppercase">GPS, Llamadas y Loncheras con Amor</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-3 bg-emerald-50/75 p-2 rounded-2xl border border-emerald-150">
            {NAV_LINKS.map((link) => {
              const linkPath = link.to.split('#')[0];
              const active = location.pathname === linkPath && !location.hash;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-6 py-3.5 rounded-xl text-sm font-extrabold transition-all text-decoration-none ${
                    active
                      ? 'text-white bg-emerald-500 shadow-md shadow-emerald-500/20'
                      : 'text-[#7d5d61] hover:text-emerald-755 hover:bg-white/50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Parent entry point */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black font-display uppercase tracking-widest px-6 py-3 rounded-2xl transition-all shadow-md shadow-emerald-500/25 border border-emerald-500 text-decoration-none flex items-center gap-2"
            >
              <Heart className="h-3.5 w-3.5 fill-current text-white" />
              <span>Ingresar — Padres</span>
            </Link>
          </div>

          {/* Mobile responsive nav toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#7d5d61] hover:bg-emerald-50 rounded-xl focus:outline-none cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#fffaf7] border-b border-emerald-250 p-4 space-y-3 animate-fade-in text-left">
            {NAV_LINKS.map((link) => {
              const linkPath = link.to.split('#')[0];
              const active = location.pathname === linkPath && !location.hash;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-extrabold block text-decoration-none ${
                    active ? 'text-white bg-emerald-500' : 'text-[#7d5d61]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-3 rounded-xl bg-emerald-500 text-white text-sm text-decoration-none font-bold flex items-center justify-center gap-2"
            >
              <Heart className="h-4 w-4 fill-current text-white" />
              <span>Ingresar — Padres</span>
            </Link>
          </div>
        )}
      </header>
    </>
  );
}
