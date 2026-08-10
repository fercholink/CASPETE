import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Heart, ArrowRight, School, Check, ChevronRight, MapPin } from 'lucide-react';
import { useLeadModal } from '../../components/landing/LeadModalProvider';

export default function InicioPage() {
  const { openLeadModal } = useLeadModal();

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20">
        {/* Soft pastel decorative gradients */}
        <div className="absolute inset-x-0 top-0 -z-10 h-[600px] bg-gradient-to-b from-[#eafaf1]/70 via-[#fff8f2] to-transparent" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-60 -z-10 animate-pulse" />
        <div className="absolute top-40 right-10 w-80 h-80 bg-[#fffbeb] rounded-full blur-3xl opacity-70 -z-10" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-y-12 gap-x-12 lg:grid-cols-12 lg:items-center">

            {/* Left Hero Text - Tender and Sweet */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <div className="inline-flex items-center gap-x-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-800">
                <Sparkles className="h-4 w-4 text-emerald-500 animate-spin" />
                <span>Ubicación en Tiempo Real y Llamadas Directas con tu Hijo</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#4e2f33] leading-[1.05]">
                Kidway: Sabe dónde está tu hijo. <span className="text-emerald-600 underline decoration-emerald-200 decoration-wavy decoration-3">Escúchalo</span> <br />
                cuando quieras 📍📞
              </h1>

              <p className="text-base text-[#61494c] max-w-xl font-medium leading-relaxed font-sans">
                Ubicación GPS en tiempo real y llamadas directas con tu hijo desde su localizador — sin que necesite un celular propio. Además, programa sus loncheras escolares y controla su alimentación, todo desde una sola app. Súper ágil, sin efectivo y protegido con <strong>Nequi</strong>.
              </p>

              {/* Badges of trust and certification */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-x-2 text-xs font-bold text-emerald-850 bg-emerald-50 px-3.5 py-2 rounded-full border border-emerald-150">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span>Rastreo GPS en Tiempo Real</span>
                </div>
                <div className="flex items-center gap-x-2 text-xs font-bold text-[#854d0e] bg-[#fef9c3] px-3.5 py-2 rounded-full border border-[#fef08a]">
                  <Check className="h-3.5 w-3.5 bg-yellow-500 text-white rounded-full p-0.5" />
                  <span>Llamadas Directas al Localizador</span>
                </div>
              </div>

              {/* Action Buttons for moms */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  to="/register"
                  className="px-8 py-4 rounded-2xl text-white font-display font-black text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-emerald-500/20 border-2 border-emerald-500 text-decoration-none"
                >
                  <Heart className="h-4 w-4 fill-current text-white" />
                  <span>Ingresar como Mamá o Papá</span>
                  <ArrowRight className="h-4 w-4 stroke-[3px]" />
                </Link>
                <button
                  onClick={() => openLeadModal('COMMISSION')}
                  className="px-8 py-4 rounded-2xl text-xs uppercase tracking-wider font-extrabold transition-all border border-[#faeae1] bg-white text-[#7d5d61] hover:bg-[#fffcf9] flex items-center justify-center gap-2.5 cursor-pointer shadow-xs"
                >
                  <School className="h-4 w-4 text-emerald-500" />
                  <span>Registrar mi Colegio</span>
                </button>
              </div>

              {/* Indicadores clave para padres */}
              <div className="grid grid-cols-3 gap-6 pt-6 text-center sm:text-left border-t border-[#f7e3d7]">
                <div>
                  <div className="font-display text-3xl font-black text-emerald-500">📍 GPS</div>
                  <div className="text-[10px] uppercase font-bold text-[#8c6d71] tracking-wider">Ubicación en Tiempo Real</div>
                </div>
                <div>
                  <div className="font-display text-3xl font-black text-purple-600 font-sans">📞 Directas</div>
                  <div className="text-[10px] uppercase font-bold text-[#8c6d71] tracking-wider">Llamadas al Localizador</div>
                </div>
                <div>
                  <div className="font-display text-3xl font-black text-[#7cd197]">🍎 +Salud</div>
                  <div className="text-[10px] uppercase font-bold text-[#8c6d71] tracking-wider">Loncheras y Nutrición</div>
                </div>
              </div>
            </div>

            {/* Right Hero Graphics - Cute and Cozy Smartphone Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="absolute inset-0 bg-radial-gradient from-emerald-500/15 via-transparent to-transparent blur-3xl -z-10" />

              {/* iPhone style Mockup - Decorated in warm emerald/green frame */}
              <div className="mx-auto max-w-[340px] rounded-[38px] border-[8px] border-emerald-250 bg-[#fffaf6] p-3 shadow-xl relative overflow-hidden ring-8 ring-emerald-50">
                {/* Cute Teddy Bear ear shape accent on header */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-3.5 w-24 bg-emerald-200 rounded-b-xl z-20" />

                {/* Screen Container */}
                <div className="bg-[#fffdfb] rounded-[28px] overflow-hidden text-left h-[500px] flex flex-col justify-between p-4 relative font-sans text-xs border border-[#faeae1]">

                  {/* Mock status bar */}
                  <div className="flex justify-between items-center text-[10px] text-[#8c6d71] font-bold px-1 select-none font-mono">
                    <span>9:41 AM 🌿</span>
                    <div className="flex items-center gap-1">
                      <span>LTE 📡</span>
                      <div className="w-5 h-2.5 border border-emerald-200 rounded-sm p-[1px] flex gap-[1px]">
                        <div className="bg-emerald-500 w-full h-full rounded-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Cute App Header */}
                  <div className="mt-4 flex justify-between items-center bg-emerald-50 p-3 rounded-2xl shadow-xs border border-emerald-200/50">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-white border border-emerald-500 flex items-center justify-center overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200" alt="Pantalla de aplicación móvil Kidway para programar loncheras escolares en Colombia" className="object-cover w-full h-full" />
                      </div>
                      <div>
                        <div className="font-black text-[#5c3a3e] text-[11px] flex items-center gap-1">
                          <span>Isabella G.</span>
                          <span className="inline-flex items-center gap-0.5 text-emerald-600 text-[8px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> En línea
                          </span>
                        </div>
                        <div className="text-[9px] text-[#8c6d71]">Saldo: <strong className="text-emerald-800 font-bold font-mono">$18.500 COP</strong></div>
                      </div>
                    </div>
                    <div className="nequi-gradient text-[8px] text-white px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-xs font-mono">
                      <span>Nequi 💚</span>
                    </div>
                  </div>

                  {/* Location + call cards */}
                  <div className="my-3 flex-1 overflow-y-auto space-y-3 pr-1">

                    {/* Live location card */}
                    <div className="bg-[#f0fbf4] border border-emerald-200 p-3 rounded-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-extrabold text-emerald-700 text-[10px] uppercase tracking-wider block font-mono">📍 Ubicación en tiempo real</span>
                        <span className="bg-emerald-100 text-emerald-850 px-2 py-0.5 rounded-full text-[9px] font-bold">Hace 2 min</span>
                      </div>
                      <div className="relative h-20 rounded-xl overflow-hidden border border-emerald-100 bg-[#e8f5ee]">
                        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(#c9e9d6 1px, transparent 1px), linear-gradient(90deg, #c9e9d6 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
                          <MapPin className="h-6 w-6 text-emerald-600 drop-shadow fill-emerald-100" />
                        </div>
                      </div>
                      <p className="text-[8px] text-[#8c6d71] font-medium mt-1.5">Camino al colegio · Trayecto normal ✓</p>
                    </div>

                    {/* Call card */}
                    <div className="bg-[#fff9f4] border border-[#f7e3d7] p-3 rounded-2xl flex items-center justify-between gap-2 shadow-xs">
                      <div className="text-left">
                        <span className="text-[10px] text-[#5c3a3e] font-bold block">Llamar a Isabella 📞</span>
                        <span className="text-[8px] text-[#8c6d71]">Desde su localizador — sin celular propio</span>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shrink-0">
                        <span className="text-sm">📞</span>
                      </div>
                    </div>

                  </div>

                  {/* Mock Push Notification */}
                  <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl shadow-md border border-emerald-150 flex items-start gap-2 animate-bounce">
                    <div className="bg-emerald-500 p-1 rounded-lg text-white">
                      <Check className="h-3 w-3 stroke-[3px]" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-[9px]">¡Isabella llegó al colegio!</div>
                      <div className="text-[8.5px] text-[#7d5d61] leading-tight font-sans">Ubicación confirmada a las 7:05 AM. ¡Te notificamos para tu tranquilidad!</div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Floating cute accents */}
              <div className="absolute -top-4 -right-4 bg-[#ffd275] text-[#5c3a3e] px-4 py-2 rounded-2xl font-display font-black text-sm rotate-6 shadow-md border border-[#fef08a] animate-pulse">
                📍 En vivo
              </div>
              <div className="absolute -bottom-6 -left-4 bg-white text-[#7d5d61] px-4 py-3 rounded-2xl font-sans text-xs font-bold shadow-md border border-[#f7e3d7] flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span>Ubicación privada, solo tú la ves</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Teaser hacia Beneficios / Funcionalidades */}
      <section className="py-16 bg-[#fffcf9] border-y border-[#faeae1]">
        <div className="mx-auto max-w-5xl px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            to="/beneficios"
            className="group bg-white p-7 rounded-[2rem] border border-[#f7e3d7] hover:border-emerald-300/50 transition-all text-left flex flex-col justify-between gap-4 text-decoration-none"
          >
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-black text-[#4e2f33]">Nuestros Beneficios</h3>
              <p className="text-xs text-[#61494c] leading-relaxed">
                Todo lo que ganan padres, tenderos y colegios al usar Kidway.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 group-hover:gap-2.5 transition-all">
              Ver beneficios <ChevronRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            to="/funcionalidades"
            className="group bg-white p-7 rounded-[2rem] border border-[#f7e3d7] hover:border-emerald-300/50 transition-all text-left flex flex-col justify-between gap-4 text-decoration-none"
          >
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-teal-400 text-white flex items-center justify-center shadow-md">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-black text-[#4e2f33]">Funcionalidades</h3>
              <p className="text-xs text-[#61494c] leading-relaxed">
                Simulador de sellos de advertencia, cómo funciona el ecosistema y planes de precios.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 group-hover:gap-2.5 transition-all">
              Explorar funcionalidades <ChevronRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
