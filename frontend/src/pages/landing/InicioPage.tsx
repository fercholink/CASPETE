import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, ArrowRight, School, ChevronRight, MapPin, Phone } from 'lucide-react';
import { useLeadModal } from '../../components/landing/LeadModalProvider';

export default function InicioPage() {
  const { openLeadModal } = useLeadModal();

  return (
    <>
      {/* Hero Section — dark "pine" band, living map as signature */}
      <section className="relative overflow-hidden bg-[#0E2A22] pt-14 pb-20 lg:pt-20 lg:pb-28">
        {/* Faint topographic glow, not a generic gradient blob */}
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #F6F2E7 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="pointer-events-none absolute -top-32 -right-24 -z-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-y-14 gap-x-12 lg:grid-cols-12 lg:items-center">

            {/* Left: thesis */}
            <div className="lg:col-span-7 space-y-7 text-left">
              <div className="inline-flex items-center gap-x-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#9FC9AE]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Para mamás y papás en Colombia</span>
              </div>

              <h1 className="font-hero text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold tracking-tight text-[#F6F2E7] leading-[1.08]">
                Sabe dónde está tu hijo.
                <br />
                <span className="text-emerald-400">Escúchalo</span> cuando quieras.
              </h1>

              <p className="text-base text-[#C9D6CC] max-w-xl leading-relaxed">
                Ubicación GPS en tiempo real y llamadas directas a su localizador — sin que tu hijo necesite un celular propio. Y cuando llega la hora del almuerzo, programas su lonchera desde la misma app.
              </p>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  to="/register"
                  className="px-7 py-4 rounded-2xl text-[#0E2A22] font-display font-black text-xs uppercase tracking-wider bg-emerald-400 hover:bg-emerald-300 transition-colors flex items-center justify-center gap-2.5 cursor-pointer text-decoration-none"
                >
                  <Heart className="h-4 w-4 fill-current" />
                  <span>Ingresar como mamá o papá</span>
                  <ArrowRight className="h-4 w-4 stroke-[3px]" />
                </Link>
                <button
                  onClick={() => openLeadModal('COMMISSION')}
                  className="px-7 py-4 rounded-2xl text-xs uppercase tracking-wider font-extrabold transition-colors border border-[#3A5347] text-[#E7E1CF] hover:bg-white/5 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <School className="h-4 w-4" />
                  <span>Registrar mi colegio</span>
                </button>
              </div>

              {/* What's included — inline, not a stat grid */}
              <div className="flex flex-wrap items-center gap-x-7 gap-y-3 pt-5 border-t border-[#233D31] text-sm text-[#C9D6CC]">
                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-400" /> Ubicación en vivo</span>
                <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-400" /> Llamadas directas</span>
                <span className="inline-flex items-center gap-2">🎒 Loncheras escolares</span>
              </div>
            </div>

            {/* Right: signature — the living map */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-[380px] -rotate-1">
                <div className="rounded-[2rem] bg-[#F6F2E7] p-5 shadow-2xl shadow-black/40">
                  <div className="flex items-center justify-between px-1 pb-3">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#0E2A22]/60">Ruta de hoy</span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
                      En vivo
                    </span>
                  </div>

                  <div className="relative">
                    <svg viewBox="0 0 380 340" className="w-full h-auto" role="img" aria-label="Mapa con la ruta de casa al colegio y la ubicación actual de tu hijo">
                      <defs>
                        <pattern id="kwMapDots" width="18" height="18" patternUnits="userSpaceOnUse">
                          <circle cx="2" cy="2" r="1.3" fill="#E2D6B8" />
                        </pattern>
                      </defs>
                      <rect x="0" y="0" width="380" height="340" rx="20" fill="url(#kwMapDots)" />

                      {/* road */}
                      <path d="M42,286 C112,266 88,168 176,140 C254,116 258,66 328,42" fill="none" stroke="#E1D3AE" strokeWidth="13" strokeLinecap="round" />
                      <path d="M42,286 C112,266 88,168 176,140 C254,116 258,66 328,42" fill="none" stroke="#FF7A50" strokeWidth="2" strokeDasharray="1 11" strokeLinecap="round" opacity="0.75" />

                      {/* home marker */}
                      <g transform="translate(24,262)">
                        <path d="M-6,18 L20,-2 L46,18 L46,44 L-6,44 Z" fill="#0E2A22" />
                        <rect x="14" y="26" width="12" height="18" fill="#F6F2E7" />
                      </g>

                      {/* school marker */}
                      <g transform="translate(298,10)">
                        <rect x="0" y="14" width="38" height="30" rx="3" fill="#0E2A22" />
                        <rect x="17" y="0" width="3" height="16" fill="#0E2A22" />
                        <path d="M20,1 L36,7 L20,13 Z" fill="#18E299" />
                      </g>
                    </svg>

                    {/* pulsing beacon = the child's live position */}
                    <div className="absolute" style={{ left: '46%', top: '40%', transform: 'translate(-50%,-50%)' }}>
                      <span className="absolute inset-0 -m-3 rounded-full bg-[#FF7A50]/30 motion-safe:animate-ping motion-reduce:hidden" />
                      <span className="absolute inset-0 -m-6 rounded-full bg-[#FF7A50]/15 motion-safe:animate-ping motion-reduce:hidden" style={{ animationDelay: '0.5s' }} />
                      <span className="relative block h-3.5 w-3.5 rounded-full bg-[#FF7A50] ring-4 ring-[#F6F2E7]" />
                    </div>

                    {/* call bubble tied to the beacon */}
                    <div className="absolute flex items-center gap-1.5 rounded-full bg-white pl-2 pr-3 py-1.5 shadow-md border border-[#EDE4CC]" style={{ left: '58%', top: '52%' }}>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Phone className="h-2.5 w-2.5" />
                      </span>
                      <span className="text-[10px] font-bold text-[#0E2A22]">Llamar a Isabella</span>
                    </div>
                  </div>

                  <p className="pt-3 px-1 font-mono text-[10px] text-[#0E2A22]/50">Última actualización · hace 2 min</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Teaser hacia Beneficios / Funcionalidades */}
      <section className="py-16 bg-[#F6F2E7] border-t border-[#E7DCC3]">
        <div className="mx-auto max-w-5xl px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            to="/beneficios"
            className="group bg-white p-7 rounded-[2rem] border border-[#EDE4CC] hover:border-emerald-300 transition-colors text-left flex flex-col justify-between gap-4 text-decoration-none"
          >
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-[#0E2A22] text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-black text-[#0E2A22]">Nuestros beneficios</h3>
              <p className="text-xs text-[#6B5D4F] leading-relaxed">
                Todo lo que ganan padres, tenderos y colegios al usar Kidway.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 group-hover:gap-2.5 transition-all">
              Ver beneficios <ChevronRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            to="/funcionalidades"
            className="group bg-white p-7 rounded-[2rem] border border-[#EDE4CC] hover:border-emerald-300 transition-colors text-left flex flex-col justify-between gap-4 text-decoration-none"
          >
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-[#0E2A22] text-emerald-400 flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-black text-[#0E2A22]">Funcionalidades</h3>
              <p className="text-xs text-[#6B5D4F] leading-relaxed">
                Cómo funciona el localizador, las geocercas y los planes de precios.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 group-hover:gap-2.5 transition-all">
              Explorar funcionalidades <ChevronRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
