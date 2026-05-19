import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  QrCode, 
  ShieldCheck, 
  Heart, 
  ChevronRight, 
  AlertTriangle, 
  Check, 
  School, 
  UtensilsCrossed,
  ArrowRight,
  Flame,
  Scale,
  Menu,
  X
} from 'lucide-react';
import { COLOMBIAN_FOOD_ITEMS } from '../data/landingMockData';
import type { FoodItem } from '../data/landingMockData';

export default function LandingPage() {
  // Real-time warning seal test widget state
  const [testFood, setTestFood] = useState<FoodItem>(COLOMBIAN_FOOD_ITEMS[4]); // default CocaCola

  const selectTestFood = (food: FoodItem) => {
    setTestFood(food);
  };

  // FAQ section toggle state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Mobile menu toggle state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lead Modal Form states (ported from original landing)
  const [leadModal, setLeadModal] = useState<null | 'COMMISSION' | 'MONTHLY'>(null);
  const [form, setForm] = useState({ 
    school_name: '', 
    nit: '', 
    city: '', 
    contact_name: '', 
    contact_email: '', 
    contact_phone: '', 
    students_count: '', 
    message: '' 
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    setSending(true); 
    setFormError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...form, 
          students_count: form.students_count ? Number(form.students_count) : undefined, 
          plan_interest: leadModal 
        }),
      });
      const json = await res.json() as { success: boolean; message?: string };
      if (!json.success) throw new Error(json.message ?? 'Error al enviar');
      setSent(true);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al enviar');
    } finally { 
      setSending(false); 
    }
  }

  function openModal(plan: 'COMMISSION' | 'MONTHLY') {
    setForm({ 
      school_name: '', 
      nit: '', 
      city: '', 
      contact_name: '', 
      contact_email: '', 
      contact_phone: '', 
      students_count: '', 
      message: '' 
    });
    setSent(false); 
    setFormError('');
    setLeadModal(plan);
  }

  const faqs = [
    {
      q: "¿Cómo se implementa Caspete en el colegio de mis hijos?",
      a: "Es sumamente sencillo. El colegio se afilia a nuestra plataforma, habilitamos el menú digital y capacitamos al operador del caspete o cafetería. A los padres se les provee el acceso para recargar con Nequi o PSE y programar las loncheras semanalmente desde su portal digital."
    },
    {
      q: "¿Cómo funciona el cobro por QR si mi hijo no lleva celular?",
      a: "No hay problema si no lleva celular. La plataforma genera un código QR único que puedes imprimir y pegar en el carné escolar físico de tu hijo de forma segura, o usar una pulsera con código QR. El cajero lo escanea desde la app de Caspete en la tableta o computador de la cafetería."
    },
    {
      q: "¿Cómo ayuda Caspete a cumplir con la Ley 2120 'Ley de Comida Chatarra'?",
      a: "Nuestra base de datos identifica todos los alimentos con sellos de advertencia frontales aprobados por el Ministerio de Salud (Alto en Azúcares, Sodio, Grasas). Al programar el menú, alertamos a los padres mostrándoles los octágonos de advertencia en tiempo real, permitiéndoles restringir productos específicos para que el niño no los pueda comprar en el colegio."
    },
    {
      q: "¿Cuáles son las opciones de recarga de saldo?",
      a: "Caspete cuenta con una integración directa con Nequi y PSE en Colombia. Puedes hacer recargas instantáneas desde $5.000 COP sin pagar comisiones costosas, controlando el presupuesto escolar de tus hijos día a día."
    },
    {
      q: "¿Se cumple con la Ley de Protección de Datos (Ley 1581)?",
      a: "Sí. Toda la información personal de los niños (fotos, grados, registros de salud o alergias) está encriptada y resguardada estrictamente, limitando el acceso únicamente a los padres y al personal docente autorizado para entregas."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#050505] text-zinc-100 selection:bg-[#98FF00] selection:text-black">
      
      {/* Dynamic Floating Global Notification Bar */}
      <div className="bg-[#12071a] text-zinc-300 py-3 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2 select-none border-b border-purple-500/10">
        <span className="bg-[#98FF00] text-black text-[9px] px-2 py-0.5 rounded-md font-black">NUEVO</span>
        <span>Ahora compatible con la Ley de Comida de Colegios (Ley 2120). Programa loncheras saludables con sellos de advertencia.</span>
      </div>

      {/* Styled Responsive Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center text-left">
          
          {/* Logo Brand Accent */}
          <Link to="/" className="flex items-center gap-2.5 focus:outline-none cursor-pointer group text-decoration-none">
            <div className="w-10 h-10 rounded-2xl bg-[#98FF00] text-black flex items-center justify-center shadow-lg shadow-[#98FF00]/10 group-hover:scale-105 transition-transform font-bold">
              <span className="text-xl font-display font-black">C</span>
            </div>
            <div>
              <span className="font-display font-black text-2xl tracking-tight text-white group-hover:text-[#98FF00] transition-colors">
                CASPETE<span className="text-[#98FF00]">.</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-extrabold block leading-none tracking-wider uppercase">Loncheras Digitales</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#111111] p-1.5 rounded-2xl border border-white/5">
            <Link
              to="/"
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all text-white bg-[#222222] shadow-sm text-decoration-none"
            >
              Inicio
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all text-zinc-400 hover:text-white text-decoration-none flex items-center gap-1.5"
            >
              <Heart className="h-3.5 w-3.5" />
              <span>Portal Padres</span>
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all text-zinc-400 hover:text-white text-decoration-none flex items-center gap-1.5"
            >
              <School className="h-3.5 w-3.5" />
              <span>Cafetería POS</span>
            </Link>
          </nav>

          {/* External Callout action */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-zinc-400 hover:text-white text-xs font-bold transition-all px-4 py-2 text-decoration-none">
              Iniciar sesión
            </Link>
            <Link to="/register" className="bg-[#98FF00] hover:bg-white text-black text-xs font-bold font-display uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all shadow-md shadow-[#98FF00]/10 border border-[#98FF00] text-decoration-none">
              Registrarse
            </Link>
          </div>

          {/* Mobile responsive nav toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-300 hover:bg-zinc-800 rounded-lg focus:outline-none cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0c0c0d] border-b border-white/5 p-4 space-y-3 animate-fade-in text-left">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold block text-white bg-[#1a1a1a] text-decoration-none"
            >
              Inicio
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 text-zinc-400 text-decoration-none"
            >
              <Heart className="h-4 w-4" />
              <span>Portal Padres</span>
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 text-zinc-400 text-decoration-none"
            >
              <School className="h-4 w-4" />
              <span>Cafetería POS</span>
            </Link>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2.5 rounded-xl border border-white/10 text-xs text-white text-decoration-none font-bold">
                Entrar
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2.5 rounded-xl bg-[#98FF00] text-black text-xs text-decoration-none font-bold">
                Registrarme
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Switch-Router Content Window */}
      <main className="flex-grow">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-26 lg:pt-24 bg-[#050505]">
          <div className="absolute inset-x-0 top-0 -z-10 h-[500px] bg-gradient-to-b from-[#12071a]/50 to-transparent" />
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#98FF00]/5 rounded-full blur-3xl" />
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-y-16 gap-x-12 lg:grid-cols-12 lg:items-center">
              
              {/* Left Hero Text */}
              <div className="lg:col-span-7 space-y-8 text-left">
                <div className="inline-flex items-center gap-x-2 rounded-full bg-[#98FF00]/10 border border-[#98FF00]/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#98FF00] font-mono">
                  <Sparkles className="h-3.5 w-3.5 text-[#98FF00]" />
                  <span>El Caspete Digital Escolar N°1 de Colombia</span>
                </div>
                
                <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-white leading-[0.95]">
                  EL CASPETE QUE <span className="block text-zinc-400">CUIDA LA <span className="text-[#98FF00] underline decoration-[#e2f92e] decoration-wavy decoration-3">SALUD</span></span> Y EL BOLSILLO.
                </h1>
                
                <p className="text-base text-zinc-400 max-w-xl font-normal leading-relaxed">
                  Programa las loncheras semanales, controla el saldo de tus hijos, evita las filas y fomenta hábitos nutritivos escolares responsables. Integración completa para pagos con <strong className="text-white hover:text-[#98FF00] font-bold">Nequi</strong> y entregas ultra-rápidas mediante <strong className="text-[#98FF00] font-bold">QR Seguro</strong>.
                </p>

                {/* Ley de comedores seguros / Ley 2120 & Ley 1581 tag */}
                <div className="flex flex-wrap items-center gap-4 py-3 border-y border-white/5">
                  <div className="flex items-center gap-x-2 text-xs font-semibold text-zinc-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                    <Scale className="h-4 w-4 text-[#98FF00]" />
                    <span>Ley 2120 (Alimentación Saludable)</span>
                  </div>
                  <div className="flex items-center gap-x-2 text-xs font-semibold text-zinc-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                    <ShieldCheck className="h-4 w-4 text-[#98FF00]" />
                    <span>Ley 1581 (Habeas Data Protegido)</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <Link
                    to="/register"
                    className="px-8 py-4 rounded-2xl text-black font-display font-black text-xs uppercase tracking-widest bg-[#98FF00] hover:bg-white hover:shadow-[#98FF00]/20 transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-lg shadow-[#98FF00]/10 border-2 border-[#98FF00] text-decoration-none"
                  >
                    <span>Crear Cuenta Gratis (Padres)</span>
                    <ArrowRight className="h-4 w-4 stroke-[3px] group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <button
                    onClick={() => openModal('MONTHLY')}
                    className="px-8 py-4 rounded-2xl text-xs uppercase tracking-widest font-black transition-all border border-white/10 bg-[#111111] text-zinc-100 hover:bg-zinc-900 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Registrar mi Colegio</span>
                    <School className="h-4 w-4 text-[#98FF00]" />
                  </button>
                </div>

                {/* Colombian features check */}
                <div className="grid grid-cols-3 gap-6 pt-6 text-center sm:text-left border-t border-white/5">
                  <div>
                    <div className="font-display text-4xl font-black text-[#98FF00]">100%</div>
                    <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Libre de Efectivo</div>
                  </div>
                  <div>
                    <div className="font-display text-4xl font-black text-purple-400">NEQUI</div>
                    <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Recargas Express</div>
                  </div>
                  <div>
                    <div className="font-display text-4xl font-black text-[#98FF00]">&lt; 5s</div>
                    <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Retiro con QR</div>
                  </div>
                </div>
              </div>

              {/* Right Hero Graphics - The interactive app mock-up */}
              <div className="lg:col-span-5 relative">
                <div className="absolute inset-0 bg-radial-gradient from-[#98FF00]/10 via-transparent to-transparent blur-3xl -z-10" />
                
                {/* iPhone style Mockup */}
                <div className="mx-auto max-w-[340px] rounded-[38px] border-[8px] border-zinc-800 bg-slate-950 p-3 shadow-2xl relative overflow-hidden ring-12 ring-white/5">
                  {/* Speaker pill */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-32 bg-slate-950 rounded-b-xl z-20" />
                  
                  {/* Screen Container */}
                  <div className="bg-[#0b0b0d] rounded-[28px] overflow-hidden text-left h-[500px] flex flex-col justify-between p-4 relative font-sans text-xs border border-white/5">
                    
                    {/* Mock status bar */}
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold px-1 select-none font-mono">
                      <span>9:41 AM</span>
                      <div className="flex items-center gap-1">
                        <span>LTE</span>
                        <div className="w-5 h-2.5 border border-zinc-700 rounded-sm p-[1px] flex gap-[1px]">
                          <div className="bg-zinc-500 w-full h-full rounded-sm" />
                        </div>
                      </div>
                    </div>

                    {/* App Header */}
                    <div className="mt-4 flex justify-between items-center bg-[#111111] p-3 rounded-2xl shadow-xs border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-[#98FF00] flex items-center justify-center overflow-hidden">
                          <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200" alt="Mateo" className="object-cover w-full h-full" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-[11px]">Mateo González</div>
                          <div className="text-[9px] text-zinc-400">Saldo: <strong className="text-[#98FF00] font-bold font-mono">$45.000 COP</strong></div>
                        </div>
                      </div>
                      <div className="nequi-gradient text-[9px] text-white px-2 py-1 rounded-lg font-bold flex items-center gap-1 shadow-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#98FF00] animate-pulse" />
                        <span>Con Nequi</span>
                      </div>
                    </div>

                    {/* Lunchbox graphic slider */}
                    <div className="my-3 flex-1 overflow-y-auto space-y-3 pr-1">
                      
                      {/* Active Lunchbox Card */}
                      <div className="bg-[#121c14] border border-[#98FF00]/10 p-3 rounded-2xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-[#98FF00] text-[10px] uppercase tracking-wider block font-mono">Menú Programado</span>
                          <span className="bg-[#98FF00]/10 text-[#98FF00] px-2 py-0.5 rounded-full text-[9px] font-semibold">Lunes</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 bg-[#050505] p-2 rounded-xl border border-white/5 shadow-xs">
                            <span className="text-lg">🍓</span>
                            <div className="flex-1">
                              <h4 className="font-bold text-zinc-100 text-[9px]">Salpicón de Frutas</h4>
                              <p className="text-[8px] text-zinc-500">100% Fruta Natural Colombiana</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-[#050505] p-2 rounded-xl border border-white/5 shadow-xs">
                            <span className="text-lg">🍪</span>
                            <div className="flex-1">
                              <h4 className="font-bold text-zinc-100 text-[9px]">Galletas de Avena</h4>
                              <p className="text-[8px] text-zinc-500">Arándanos & Miel</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* QR Code Container */}
                      <div className="bg-[#111111] border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center space-y-2 shadow-xs">
                        <span className="text-[10px] text-zinc-300 text-center font-bold">QR Único para Reclamos</span>
                        <div className="h-28 w-28 bg-black border-2 border-dashed border-[#98FF00]/40 rounded-xl p-2 flex items-center justify-center relative qr-glow">
                          <QrCode className="h-full w-full text-[#98FF00]" />
                          <div className="absolute bg-[#98FF00] px-2 py-0.5 text-[8px] font-extrabold text-black rounded-full shadow-xs -bottom-1">
                            Mateo #908
                          </div>
                        </div>
                        <span className="text-[8px] text-zinc-500 text-center font-mono">Se autoriza entrega - Protegido Ley 1581</span>
                      </div>

                    </div>

                    {/* Mock Push Notification */}
                    <div className="bg-[#1e0a29] text-white p-2 rounded-xl shadow-lg border border-purple-500/15 flex items-start gap-2 animate-bounce">
                      <div className="bg-[#98FF00] p-1 rounded-md text-black">
                        <Check className="h-3 w-3 stroke-[3px]" />
                      </div>
                      <div>
                        <div className="font-bold text-[9px]">¡Caspete Escaneado!</div>
                        <div className="text-[8px] opacity-90 text-zinc-300 font-sans">Mateo retiró su almuerzo saludable. Saldo escolar: $39.500.</div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Float accents */}
                <div className="absolute -top-4 -right-4 bg-[#98FF00] text-black px-4 py-2 rounded-xl font-display font-black text-sm rotate-6 shadow-md border border-white/10 animate-pulse hidden md:block">
                  ¡Adiós Efectivo! 🪙
                </div>
                <div className="absolute -bottom-6 -left-4 bg-[#111111] text-zinc-300 px-4 py-3 rounded-xl font-sans text-xs font-semibold shadow-lg border border-white/5 flex items-center gap-2 hidden md:flex">
                  <div className="w-3 h-3 rounded-full bg-[#98FF00]" />
                  <span>Saludable y Seguro</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Real-time Interactive Feature: Colombia's Ley 2120 Warning Seal Simulator */}
        <section className="py-24 bg-[#08080a] border-y border-white/5">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center space-y-4">
              <h2 className="font-display text-4xl font-extrabold text-white leading-tight tracking-tight">
                Cumplimiento Real de la Ley de Alimentación Escolar (Ley 2120)
              </h2>
              <p className="text-zinc-400 text-sm">
                Caspete evalúa al instante los ingredientes y etiqueta el menú escolar. <span className="text-[#98FF00] font-bold">Haz la prueba seleccionando un alimento de tienda escolar</span> para ver la advertencia de sellos y cómo ayudamos a que tus hijos elijan más sano:
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">
              
              {/* Left selector - typical foods in colombian school stores */}
              <div className="md:col-span-5 bg-[#111111] p-6 rounded-[2rem] border border-white/5 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-zinc-100 mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
                    <UtensilsCrossed className="h-4 w-4 text-[#98FF00]" />
                    <span>Productos Disponibles</span>
                  </h3>
                  <div className="space-y-2">
                    {COLOMBIAN_FOOD_ITEMS.map((food) => (
                      <button
                        key={food.id}
                        onClick={() => selectTestFood(food)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left group cursor-pointer ${
                          testFood.id === food.id
                            ? 'border-[#98FF00]/40 bg-[#121c14] ring-1 ring-[#98FF00]/25'
                            : 'border-white/5 hover:border-white/10 bg-[#070709]/50 hover:bg-[#0d0d0f]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl bg-[#111] p-2 rounded-xl border border-white/5 shadow-xs">{food.image}</span>
                          <div>
                            <div className="font-bold text-white text-xs group-hover:text-[#98FF00] transition-colors">{food.name}</div>
                            <span className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wide leading-none mt-1 inline-block ${
                              food.isHealthy ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40' : 'bg-rose-950/50 text-rose-400 border border-rose-900/40'
                            }`}>
                              {food.isHealthy ? 'Saludable ✅' : 'Exceso / Chatarra ⚠️'}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs font-bold font-mono text-zinc-400">${food.price.toLocaleString('es-CO')}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right scanner review - detailed analysis display */}
              <div className="md:col-span-7 bg-[#111111] p-7 rounded-[2rem] border border-white/5 flex flex-col justify-between space-y-6">
                
                {/* Product Profile */}
                <div className="space-y-4 flex-1">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Análisis Nutricional Caspete</span>
                      <h3 className="font-display text-2xl font-black text-white mt-1">{testFood.name}</h3>
                    </div>
                    <span className="text-4xl p-4 bg-[#0a0a0d] rounded-2xl border border-white/5">{testFood.image}</span>
                  </div>

                  {/* Colombia Octagonal Seals */}
                  <div className="py-4 border-y border-white/5">
                    <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider block mb-3 font-mono">Sellos Frontales Obligatorios (Ley 2120):</span>
                    {testFood.seals.length > 0 ? (
                      <div className="flex flex-wrap gap-2.5">
                        {testFood.seals.map((seal, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-black text-white font-mono px-3 py-2 rounded-lg text-xs font-black select-none border border-zinc-700 shadow-md">
                            <AlertTriangle className="h-3.5 w-3.5 text-[#98FF00]" />
                            <span>ALTO EN {seal.toUpperCase()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-4 py-3 rounded-xl text-xs font-bold">
                        <Check className="h-4 w-4 bg-emerald-500 text-black rounded-full p-0.5" />
                        <div>
                          <span>Este alimento califica como <strong className="text-white">PRODUCTO SALUDABLE</strong>.</span>
                          <p className="font-normal text-zinc-400 mt-0.5">Libre de sellos de advertencia en Colombia. Apto para loncheras escolares programadas.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Details list */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-zinc-500 font-extrabold uppercase font-mono tracking-wider">Ingredientes clave:</span>
                      <p className="text-xs text-zinc-300 mt-1">{testFood.ingredients.join(', ')}</p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500 font-extrabold uppercase font-mono tracking-wider">Alérgenos registrados:</span>
                      <p className="text-xs text-zinc-300 mt-1">{testFood.allergens.length > 0 ? testFood.allergens.join(', ') : 'Ninguno registrado'}</p>
                    </div>
                  </div>
                </div>

                {/* Caspete Recommendation Rule Box */}
                <div className={`p-4 rounded-xl border ${
                  testFood.isHealthy 
                    ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' 
                    : 'bg-amber-950/20 border-amber-900/30 text-amber-500'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg ${testFood.isHealthy ? 'bg-emerald-900 text-white' : 'bg-[#98FF00] text-black'}`}>
                      <Flame className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-sm text-zinc-200">
                        {testFood.isHealthy 
                          ? '¡Aprobado para Loncheras!' 
                          : 'Acción Caspete: Filtro de Padres Activado'}
                      </h4>
                      <p className="text-xs font-normal mt-1 text-zinc-400 leading-relaxed">
                        {testFood.isHealthy 
                          ? 'Este producto puede añadirse libremente al plan diario de los niños. Su bajo nivel procesal promueve un desarrollo saludable.' 
                          : 'Si el padre bloquea este producto en su configuración, Caspete bloqueará automáticamente la venta en el colegio, sugiriendo un reemplazo como "Porción de Fruta Picada" para cumplir la directriz de entornos escolares.'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* Bento Grid: Core Value Proposition Pillars */}
        <section className="py-24 bg-[#050505]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center space-y-4">
              <h2 className="font-display text-4xl font-extrabold text-white leading-tight tracking-tight">
                Una solución integral para toda la comunidad escolar
              </h2>
              <p className="text-zinc-400 text-sm">
                Caspete es un puente digital inteligente entre padres que cuidan a sus hijos, colegios que buscan innovar y operarios de cafeterías que requieren automatización.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              
              {/* Bento Card 1: Parents */}
              <div className="bg-[#111111] p-8 rounded-[2rem] border border-white/5 flex flex-col justify-between space-y-8 relative overflow-hidden group hover:border-[#98FF00]/25 transition-all">
                <div className="absolute top-0 right-0 h-24 w-24 bg-[#98FF00]/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
                <div className="space-y-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-[#98FF00] text-black flex items-center justify-center shadow-md font-bold">
                    <Heart className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-2xl font-extrabold text-white">Para Padres</h3>
                  <ul className="space-y-2.5 text-sm text-zinc-400">
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-[#98FF00] flex-shrink-0" />
                      <span>Programa loncheras saludables semanales</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-[#98FF00] flex-shrink-0" />
                      <span>Controla el saldo digital desde Nequi</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-[#98FF00] flex-shrink-0" />
                      <span>Restringe alérgenos y comida chatarra</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-[#98FF00] flex-shrink-0" />
                      <span>Recibe alertas de retiro por QR</span>
                    </li>
                  </ul>
                </div>
                <Link 
                  to="/register"
                  className="w-full py-3 rounded-xl border border-white/5 bg-[#1a1a1e] hover:bg-[#222226] text-zinc-100 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-decoration-none"
                >
                  <span>Saber más / Registrarme</span>
                  <ChevronRight className="h-4 w-4 text-[#98FF00]" />
                </Link>
              </div>

              {/* Bento Card 2: Operators / Cashier */}
              <div className="bg-[#111111] p-8 rounded-[2rem] border border-white/5 flex flex-col justify-between space-y-8 relative overflow-hidden group hover:border-[#98FF00]/25 transition-all">
                <div className="absolute top-0 right-0 h-24 w-24 bg-[#98FF00]/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
                <div className="space-y-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-[#98FF00] text-black flex items-center justify-center shadow-md font-bold">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-2xl font-extrabold text-white">Para Cafeterías</h3>
                  <ul className="space-y-2.5 text-sm text-zinc-400">
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-[#98FF00] flex-shrink-0" />
                      <span>Lectura QR ultra veloz (&lt; 5 segundos)</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-[#98FF00] flex-shrink-0" />
                      <span>Pre-orders reducen desperdicios de comida</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-[#98FF00] flex-shrink-0" />
                      <span>Alertas visibles de alergias en escaneo</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-[#98FF00] flex-shrink-0" />
                      <span>Cuentas claras sin portar efectivo escolar</span>
                    </li>
                  </ul>
                </div>
                <Link 
                  to="/login"
                  className="w-full py-3 rounded-xl border border-white/5 bg-[#1a1a1e] hover:bg-[#222226] text-zinc-100 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-decoration-none"
                >
                  <span>Entrar a Cafetería POS</span>
                  <ChevronRight className="h-4 w-4 text-[#98FF00]" />
                </Link>
              </div>

              {/* Bento Card 3: Institutions */}
              <div className="bg-[#160a22] text-white p-8 rounded-[2rem] border border-purple-950/40 flex flex-col justify-between space-y-8 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                <div className="absolute top-0 right-0 h-24 w-24 bg-purple-900/10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
                <div className="space-y-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                    <School className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-2xl font-extrabold">Para Colegios</h3>
                  <ul className="space-y-2.5 text-sm text-purple-200/90">
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-purple-400 flex-shrink-0" />
                      <span>Entornos escolares 100% tecnológicos</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-purple-400 flex-shrink-0" />
                      <span>Garantía de Ley 2120 de alimentación</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-purple-400 flex-shrink-0" />
                      <span>Estudiantes sin efectivo (evita bullying)</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-purple-400 flex-shrink-0" />
                      <span>Data de hábitos alimentarios agregados</span>
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => openModal('MONTHLY')}
                  className="w-full py-3 rounded-xl border border-purple-900/50 bg-[#251036] hover:bg-[#2e1345] text-purple-200 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Solicitar Demo Institucional</span>
                  <ChevronRight className="h-4 w-4 text-purple-400" />
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-24 bg-[#08080a] border-t border-white/5">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center space-y-4">
              <h2 className="font-display text-4xl font-extrabold text-white leading-tight tracking-tight">
                ¿Cómo funciona el ecosistema Caspete?
              </h2>
              <p className="text-zinc-400 text-sm">
                Transformamos la hora del descanso escolar en un proceso rápido, amigable y completamente digital en 3 simples pasos.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 relative text-left">
              
              {/* Step 1 */}
              <div className="flex flex-col items-start space-y-4">
                <div className="w-14 h-14 rounded-full bg-zinc-900 border border-white/10 text-[#98FF00] flex items-center justify-center font-display font-black text-xl shadow-md font-mono">
                  <span>1</span>
                </div>
                <h3 className="font-display text-xl font-bold text-white">Recarga y Limita</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  El padre recarga de forma express desde su cuenta de <strong className="text-[#e23080] font-bold">Nequi</strong>. Configura las alergias de su hijo y fija un presupuesto diario máximo para compras discrecionales.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-start space-y-4">
                <div className="w-14 h-14 rounded-full bg-zinc-900 border border-white/10 text-[#98FF00] flex items-center justify-center font-display font-black text-xl shadow-md font-mono">
                  <span>2</span>
                </div>
                <h3 className="font-display text-xl font-bold text-white">Programa Loncheras</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Revisa el menú digital escolar semanal aprobado por el nutricionista. Selecciona los refrigerios para cada día, evitando los alimentos señalados con octágonos alertantes en la pantalla.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-start space-y-4">
                <div className="w-14 h-14 rounded-full bg-zinc-900 border border-white/10 text-purple-400 flex items-center justify-center font-display font-black text-xl shadow-md font-mono">
                  <span>3</span>
                </div>
                <h3 className="font-display text-xl font-bold text-white">Entrega Express con QR</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  El estudiante presenta su carné con el código QR generado. En la cafetería escanean el código, comprueban las alergias al instante y entregan el producto en segundos, sin filas ni demoras.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Pricing / Plan Modalities for Schools */}
        <section className="py-24 bg-[#050505] border-t border-white/5">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
              <span className="text-[#98FF00] text-xs font-extrabold tracking-widest uppercase block font-mono">Planes para Colegios</span>
              <h2 className="font-display text-4xl font-extrabold text-white leading-tight tracking-tight">
                Elige la modalidad ideal de tu institución
              </h2>
              <p className="text-zinc-400 text-sm">
                Dos formas de trabajar con Caspete. Ambas incluyen la totalidad de las funciones de la plataforma.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
              
              {/* Commission Plan */}
              <div className="bg-[#111111] p-10 rounded-[2.5rem] border border-white/5 flex flex-col justify-between space-y-8 relative overflow-hidden group hover:border-[#98FF00]/20 transition-all">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-4xl">📊</span>
                    <span className="bg-[#98FF00]/10 text-[#98FF00] border border-[#98FF00]/20 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest">Sin Costo Fijo</span>
                  </div>
                  <h3 className="font-display text-2xl font-black text-white mb-3">Modalidad por Comisión</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                    Caspete cobra un porcentaje por cada transacción procesada en la plataforma. Sin mensualidad fija. Ideal para colegios que quieren empezar sin riesgo y digitalizar su entorno.
                  </p>
                  <ul className="space-y-3.5 text-xs text-zinc-300">
                    <li className="flex items-center gap-x-2.5">
                      <Check className="h-4 w-4 text-[#98FF00] flex-shrink-0" />
                      <span>Sin costo mensual fijo</span>
                    </li>
                    <li className="flex items-center gap-x-2.5">
                      <Check className="h-4 w-4 text-[#98FF00] flex-shrink-0" />
                      <span>Paga solo sobre lo que se vende</span>
                    </li>
                    <li className="flex items-center gap-x-2.5">
                      <Check className="h-4 w-4 text-[#98FF00] flex-shrink-0" />
                      <span>Activación inmediata del servicio</span>
                    </li>
                    <li className="flex items-center gap-x-2.5">
                      <Check className="h-4 w-4 text-[#98FF00] flex-shrink-0" />
                      <span>Todas las funciones transaccionales y legales</span>
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => openModal('COMMISSION')}
                  className="w-full py-4 rounded-2xl text-black font-display font-black text-xs uppercase tracking-widest bg-[#98FF00] hover:bg-white hover:shadow-[#98FF00]/10 border-2 border-[#98FF00] transition-all cursor-pointer text-center"
                >
                  Solicitar Información
                </button>
              </div>

              {/* Monthly Plan */}
              <div className="bg-[#160a22] p-10 rounded-[2.5rem] border border-purple-950/40 flex flex-col justify-between space-y-8 relative overflow-hidden group hover:border-purple-500/20 transition-all">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-4xl">📅</span>
                    <span className="bg-purple-950 text-purple-300 border border-purple-800 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest">Suscripción Fija</span>
                  </div>
                  <h3 className="font-display text-2xl font-black text-white mb-3">Modalidad Mensual</h3>
                  <p className="text-purple-300/80 text-xs leading-relaxed mb-6">
                    El colegio paga una tarifa mensual negociada según el tamaño de la institución. Transacciones 100% libres de comisión en recargas. Ideal para colegios con alto volumen.
                  </p>
                  <ul className="space-y-3.5 text-xs text-purple-200">
                    <li className="flex items-center gap-x-2.5">
                      <Check className="h-4 w-4 text-purple-400 flex-shrink-0" />
                      <span>Tarifa mensual fija según número de alumnos</span>
                    </li>
                    <li className="flex items-center gap-x-2.5">
                      <Check className="h-4 w-4 text-purple-400 flex-shrink-0" />
                      <span>Transacciones ilimitadas sin comisión adicional</span>
                    </li>
                    <li className="flex items-center gap-x-2.5">
                      <Check className="h-4 w-4 text-purple-400 flex-shrink-0" />
                      <span>Soporte prioritario y personalizado</span>
                    </li>
                    <li className="flex items-center gap-x-2.5">
                      <Check className="h-4 w-4 text-purple-400 flex-shrink-0" />
                      <span>Personalización de logo y colores corporativos</span>
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => openModal('MONTHLY')}
                  className="w-full py-4 rounded-2xl text-purple-200 font-display font-black text-xs uppercase tracking-widest border-2 border-purple-800 bg-[#251036] hover:bg-[#34184c] transition-all cursor-pointer text-center"
                >
                  Solicitar Información
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* General FAQ Section */}
        <section className="py-24 bg-[#08080a] border-t border-white/5 pb-20">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="text-center space-y-4 mb-16">
              <h2 className="font-display text-4xl font-extrabold text-white leading-tight tracking-tight">
                Preguntas Frecuentes
              </h2>
              <p className="text-zinc-400 text-sm">
                ¿Tienes dudas sobre cómo implementar Caspete o cómo protege a los menores? Aquí respondemos a tus preguntas principales.
              </p>
            </div>

            <div className="space-y-2 border-t border-white/5 pt-6 text-left">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-white/5 pb-4">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex justify-between items-center py-4 text-left font-display font-bold text-zinc-200 hover:text-[#98FF00] transition-colors text-base sm:text-lg focus:outline-none cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="text-[#98FF00] font-bold text-xl ml-4 font-mono">
                      {openFaq === index ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === index && (
                    <p className="text-zinc-400 text-sm leading-relaxed pb-3 pl-1 animate-fade-in text-left">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final Action Banner CTA */}
        <section className="py-24 bg-gradient-to-b from-[#0e0e11] to-[#070709] border-t border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-[#98FF00]/5 via-transparent to-transparent blur-3xl -z-10" />
          <div className="mx-auto max-w-5xl px-6 text-center space-y-8 relative z-10">
            <h2 className="font-display text-4xl font-black text-white max-w-2xl mx-auto tracking-tight leading-tight">
              Únete a la revolución escolar y dile adiós al efectivo
            </h2>
            <p className="text-zinc-400 max-w-lg mx-auto text-sm leading-relaxed">
              Garantiza una alimentación coordinada, segura y con trazabilidad digital inmediata. Puedes habilitarlo en el colegio hoy mismo.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-4 max-w-md mx-auto">
              <Link
                to="/register"
                className="px-8 py-4 rounded-xl text-black font-display font-bold bg-[#98FF00] hover:bg-[#a9ff2e] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#98FF00]/10 hover:shadow-[#98FF00]/25 cursor-pointer text-decoration-none"
              >
                <span>Crear Cuenta Gratis</span>
                <Sparkles className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Lead Form Modal */}
        {leadModal && (
          <div 
            onClick={e => { if (e.target === e.currentTarget) setLeadModal(null); }} 
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          >
            <div className="bg-[#111113] border border-white/10 rounded-[2rem] p-8 sm:p-10 w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl relative text-left">
              
              {sent ? (
                <div className="text-center py-10 space-y-4">
                  <div className="text-6xl">🎉</div>
                  <h3 className="font-display text-2xl font-black text-[#98FF00]">¡Datos Recibidos!</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                    Muchas gracias por tu interés. Nuestro equipo se comunicará contigo en menos de 24 horas hábiles para coordinar la demostración o afiliar a tu colegio.
                  </p>
                  <button 
                    onClick={() => setLeadModal(null)} 
                    className="px-8 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-bold text-xs uppercase tracking-widest text-white transition-all cursor-pointer border-none"
                  >
                    Cerrar Ventana
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-display text-2xl font-black text-white">Solicitar Información</h3>
                      <p className="text-xs text-zinc-500 mt-1 font-mono">
                        Modalidad de Interés: <span className="text-[#98FF00] font-bold">{leadModal === 'COMMISSION' ? 'Comisión transaccional' : 'Suscripción mensual'}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => setLeadModal(null)} 
                      className="bg-transparent border-none text-2xl cursor-pointer text-zinc-500 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={submitLead} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Nombre del Colegio *</label>
                        <input 
                          required 
                          type="text"
                          value={form.school_name} 
                          onChange={e => setForm(f => ({ ...f, school_name: e.target.value }))} 
                          placeholder="Colegio San José"
                          className="w-full bg-[#1b1b1e] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#98FF00] transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">NIT del Colegio</label>
                        <input 
                          type="text"
                          value={form.nit} 
                          onChange={e => setForm(f => ({ ...f, nit: e.target.value }))} 
                          placeholder="900.123.456-1"
                          className="w-full bg-[#1b1b1e] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#98FF00] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Ciudad *</label>
                        <input 
                          required 
                          type="text"
                          value={form.city} 
                          onChange={e => setForm(f => ({ ...f, city: e.target.value }))} 
                          placeholder="Bogotá"
                          className="w-full bg-[#1b1b1e] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#98FF00] transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">N° de Estudiantes Aprox.</label>
                        <input 
                          type="number" 
                          min="1"
                          value={form.students_count} 
                          onChange={e => setForm(f => ({ ...f, students_count: e.target.value }))} 
                          placeholder="350"
                          className="w-full bg-[#1b1b1e] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#98FF00] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Nombre del Rector / Administrador *</label>
                      <input 
                        required 
                        type="text"
                        value={form.contact_name} 
                        onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} 
                        placeholder="Dr. Carlos Rodríguez"
                        className="w-full bg-[#1b1b1e] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#98FF00] transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Correo Electrónico *</label>
                        <input 
                          required 
                          type="email"
                          value={form.contact_email} 
                          onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} 
                          placeholder="rector@colegio.edu.co"
                          className="w-full bg-[#1b1b1e] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#98FF00] transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Teléfono / WhatsApp</label>
                        <input 
                          type="text"
                          value={form.contact_phone} 
                          onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} 
                          placeholder="3001234567"
                          className="w-full bg-[#1b1b1e] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#98FF00] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Mensaje Adicional</label>
                      <textarea 
                        rows={3} 
                        value={form.message} 
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))} 
                        placeholder="Cuéntanos brevemente cuáles son las necesidades de alimentación o recaudo en tu colegio..."
                        className="w-full bg-[#1b1b1e] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#98FF00] transition-colors resize-none"
                      />
                    </div>

                    {formError && <p className="text-red-400 text-xs font-semibold">{formError}</p>}
                    
                    <button 
                      type="submit" 
                      disabled={sending} 
                      className="w-full py-4 rounded-xl text-black font-display font-black text-xs uppercase tracking-widest bg-[#98FF00] hover:bg-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none shadow-lg shadow-[#98FF00]/10"
                    >
                      {sending ? 'Enviando Datos...' : '📨 Enviar Solicitud de Demo'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Structured Legal Footer & Technical specifications (Colombia contexts) */}
      <footer className="bg-[#0b0b0b] text-zinc-500 py-16 border-t border-white/5 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#98FF00] text-black flex items-center justify-center font-bold">
                <span className="font-display font-black text-xs">C</span>
              </div>
              <span className="font-display font-black text-xl text-white tracking-tight">
                CASPETE<span className="text-[#98FF00]">.</span>com
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              La plataforma colombiana pionera en la nutrición, control digital, saldos prepago y trazabilidad con QR seguro para colegios de Colombia.
            </p>
          </div>

          {/* Dynamic features links */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Plataforma</h5>
            <div className="flex flex-col gap-3 text-xs">
              <Link to="/login" className="text-zinc-500 hover:text-[#98FF00] transition-colors text-decoration-none">
                Iniciar sesión (Padres)
              </Link>
              <Link to="/register" className="text-zinc-500 hover:text-[#98FF00] transition-colors text-decoration-none">
                Registrarse (Padres)
              </Link>
              <Link to="/login" className="text-zinc-500 hover:text-[#98FF00] transition-colors text-decoration-none">
                Punto de Venta Cafetería (POS)
              </Link>
            </div>
          </div>

          {/* Legal references */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Seguridad y Normativa</h5>
            <div className="flex flex-col gap-3 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#98FF00]" />
                <span>Ley 1581 (Habeas Data Menores)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-[#98FF00]" />
                <span>Ley 2120 (Alimentos Escolares)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#98FF00]" />
                <span>Aprobación de menús por Nutricionistas</span>
              </div>
            </div>
          </div>

          {/* Developers / Brand note */}
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-white uppercase tracking-widest">Contacto</h5>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              ¿Tienes alguna duda o quieres soporte directo en Colombia? Escríbenos a:
            </p>
            <div className="flex flex-col gap-1 text-[11px]">
              <a href="mailto:hola@caspete.co" className="text-zinc-400 hover:text-[#98FF00] text-decoration-none">hola@caspete.co</a>
              <a href="mailto:privacidad@caspete.com" className="text-zinc-400 hover:text-[#98FF00] text-decoration-none">privacidad@caspete.com</a>
              <a href="https://wa.me/573214364223" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-[#98FF00] text-decoration-none mt-1 font-bold">💬 WhatsApp: +57 321 436 4223</a>
            </div>
          </div>

        </div>

        {/* Small bottom text */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <span>&copy; {new Date().getFullYear()} Caspete S.A.S. Todos los derechos reservados. Colombia.</span>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="text-zinc-500 hover:text-[#98FF00] text-decoration-none">Política de Privacidad (Habeas Data)</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
