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
  Menu,
  X,
  Smile,
  Star,
  Award
} from 'lucide-react';
import { COLOMBIAN_FOOD_ITEMS } from '../data/landingMockData';
import type { FoodItem } from '../data/landingMockData';

export default function LandingPage() {
  // Real-time warning seal test widget state
  const [testFood, setTestFood] = useState<FoodItem>(COLOMBIAN_FOOD_ITEMS[0]); // default Salpicon (healthy & delicious)

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
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const url = baseUrl.endsWith('/api') ? `${baseUrl}/leads` : `${baseUrl}/api/leads`;
      const res = await fetch(url, {
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
      q: "💝 ¿Cómo se implementa Caspete en el colegio de mis hijos?",
      a: "¡Es muy sencillo y con total acompañamiento! El colegio se registra en nuestra red, habilitamos el menú digital seguro supervisado por expertos y les damos a las mamás y papás acceso inmediato para recargar saldo cómodamente por Nequi para programar las loncheras con mucho amor de forma semanal."
    },
    {
      q: "🎒 Mi hijo pequeño no tiene celular, ¿cómo compra su lonchera?",
      a: "¡No te preocupes, no necesitan tecnología en sus manitas! Puedes imprimir un código QR tierno en un carné escolar, guardarlo en su cartuchera o utilizar una linda pulserita de silicona. El operario lo escanea con amor en la tablet del caspete, garantizando una entrega segura sin monedas sucias."
    },
    {
      q: "🥦 ¿Cómo ayuda Caspete con los Sellos de Advertencia (Ley 2120 de comida saludable)?",
      a: "Al programar la comida semanal de tus pequeños, te mostraremos de forma muy intuitiva los octágonos de advertencia de alimentos procesados (como altos azúcares o sodio). Podrás descartarlos con un solo toque y elegir opciones mágicas y dulces como frutas frescas o arepitas saludables."
    },
    {
      q: "🏦 ¿Es fácil recargar el saldo escolar para mis pequeños?",
      a: "¡Así es, mamá! Sincronizamos de forma segura con Nequi y PSE en Colombia. Puedes recargar montos pequeños (desde $5.000 COP) sin cobros extra ocultos. Es como darles el dinero diario para el descanso, pero limpio, seguro y controlado con cariño."
    },
    {
      q: "🔒 ¿Están seguros los datos y la foto de mi hijo de acuerdo a la ley?",
      a: "Totalmente. La privacidad de tus tesoros es sagrada. En conformidad con la Ley 1581 (Habeas Data de Colombia), toda la información, fotitos y alergias están blindadas y cifradas. Solo tú y el personal autorizado encargado de entregar el refrigerio pueden verlas."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#fdf8f4] text-[#3f2e2e] selection:bg-emerald-500 selection:text-white">
      
      {/* Dynamic Floating Global Notification Bar - Healthy Green / Sano theme */}
      <div className="bg-emerald-50 text-emerald-800 py-3 px-4 text-center text-xs font-bold flex items-center justify-center gap-2 select-none border-b border-emerald-200">
        <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black animate-pulse flex items-center gap-0.5">
          <Heart className="h-2.5 w-2.5 fill-current text-white" /> AMOR ES SALUD
        </span>
        <span>Cumplimos con la Ley de Alimentación Escolar (Ley 2120 de Colombia). ¡Diseña loncheras nutritivas y felices para tus pequeños! 🍎🥦</span>
      </div>

      {/* Styled Responsive Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#fffaf5]/95 backdrop-blur-md border-b border-[#faeae1] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center text-left">
          
          {/* Logo Brand Accent with a cute round kid face feel */}
          <Link to="/" className="flex items-center gap-2.5 focus:outline-none cursor-pointer group text-decoration-none">
            <div className="w-11 h-11 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-all">
              <Smile className="h-6 w-6 stroke-[2.5px] animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-display font-black text-2xl tracking-tight text-emerald-600 group-hover:text-emerald-500 transition-colors">
                  Caspete
                </span>
                <span className="text-2xl font-bold text-emerald-500">🥦</span>
              </div>
              <span className="text-[10px] text-[#8c6d71] font-bold block leading-none tracking-wide uppercase">Loncheras con Amor y Trazabilidad</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2 bg-emerald-50/75 p-1.5 rounded-2xl border border-emerald-150">
            <Link
              to="/"
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all text-white bg-emerald-500 shadow-md shadow-emerald-500/20 text-decoration-none"
            >
              🥦 Inicio Sano
            </Link>
            <Link
              to="/login"
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all text-[#7d5d61] hover:text-emerald-755 hover:bg-white/50 text-decoration-none flex items-center gap-1.5"
            >
              <Heart className="h-3.5 w-3.5 fill-current text-emerald-300" />
              <span>Portal de Mamás y Papás</span>
            </Link>
            <Link
              to="/login"
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all text-[#7d5d61] hover:text-emerald-755 hover:bg-white/50 text-decoration-none flex items-center gap-1.5"
            >
              <School className="h-3.5 w-3.5 text-emerald-450" />
              <span>Cafetería Escolar (Simulación POS)</span>
            </Link>
          </nav>

          {/* External Callout action */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-[#7d5d61] hover:text-emerald-600 text-xs font-black transition-all px-4 py-2 text-decoration-none">
              Iniciar sesión
            </Link>
            <Link to="/register" className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black font-display uppercase tracking-widest px-6 py-3 rounded-2xl transition-all shadow-md shadow-emerald-500/25 border border-emerald-500 text-decoration-none">
              Registrarse
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
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-extrabold block text-white bg-emerald-500 text-decoration-none"
            >
              🥦 Inicio Sano
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-extrabold flex items-center gap-2 text-[#7d5d61] text-decoration-none"
            >
              <Heart className="h-4 w-4 fill-current text-emerald-400" />
              <span>Portal de Mamás y Papás</span>
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-extrabold flex items-center gap-2 text-[#7d5d61] text-decoration-none"
            >
              <School className="h-4 w-4" />
              <span>Cafetería POS</span>
            </Link>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2.5 rounded-xl border border-[#faeae1] text-xs text-[#7d5d61] text-decoration-none font-bold">
                Entrar
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2.5 rounded-xl bg-emerald-500 text-white text-xs text-decoration-none font-bold">
                Registrarme
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Switch-Router Content Window */}
      <main className="flex-grow">
        
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
                  <span>La Lonchera Escolar Más Saborera, Sana y Segura de Colombia</span>
                </div>
                
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#4e2f33] leading-[1.05]">
                  ¡Loncheras <span className="text-emerald-600 underline decoration-emerald-200 decoration-wavy decoration-3">Felices</span>, <br />
                  Hijos <span className="text-emerald-555">Sanos</span> y Mamás Tranquilas! 🍏🎒
                </h1>
                
                <p className="text-base text-[#61494c] max-w-xl font-medium leading-relaxed font-sans">
                  Establece límites diarios con amor, programa meriendas nutritivas semanales y mantente al tanto de la nutrición de tus pequeños. Súper ágil, sin efectivo, libre de comisionistas y protegido con <strong>Nequi</strong> y <strong>QR Infantil seguro</strong>. ¡Diles adiós a las preocupaciones!
                </p>

                {/* Badges of trust and certification */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-x-2 text-xs font-bold text-emerald-850 bg-emerald-50 px-3.5 py-2 rounded-full border border-emerald-150">
                    <Award className="h-4 w-4 text-emerald-600" />
                    <span>Aprobado por Nutricionistas</span>
                  </div>
                  <div className="flex items-center gap-x-2 text-xs font-bold text-[#854d0e] bg-[#fef9c3] px-3.5 py-2 rounded-full border border-[#fef08a]">
                    <Check className="h-3.5 w-3.5 bg-yellow-500 text-white rounded-full p-0.5" />
                    <span>Ley 2120 de Entornos Saludables</span>
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
                    onClick={() => openModal('MONTHLY')}
                    className="px-8 py-4 rounded-2xl text-xs uppercase tracking-wider font-extrabold transition-all border border-[#faeae1] bg-white text-[#7d5d61] hover:bg-[#fffcf9] flex items-center justify-center gap-2.5 cursor-pointer shadow-xs"
                  >
                    <School className="h-4 w-4 text-emerald-500" />
                    <span>Registrar mi Colegio</span>
                  </button>
                </div>

                {/* School statistics indicators */}
                <div className="grid grid-cols-3 gap-6 pt-6 text-center sm:text-left border-t border-[#f7e3d7]">
                  <div>
                    <div className="font-display text-3xl font-black text-emerald-500">🥬 100%</div>
                    <div className="text-[10px] uppercase font-bold text-[#8c6d71] tracking-wider">Limpio y Libre de Monedas</div>
                  </div>
                  <div>
                    <div className="font-display text-3xl font-black text-purple-600 font-sans">💚 Nequi</div>
                    <div className="text-[10px] uppercase font-bold text-[#8c6d71] tracking-wider">Ahorro y Recarga Familiar</div>
                  </div>
                  <div>
                    <div className="font-display text-3xl font-black text-[#7cd197]">🍎 +Salud</div>
                    <div className="text-[10px] uppercase font-bold text-[#8c6d71] tracking-wider">Trazabilidad de Alergias</div>
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
                          <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200" alt="Isabella" className="object-cover w-full h-full" />
                        </div>
                        <div>
                          <div className="font-black text-[#5c3a3e] text-[11px] flex items-center gap-1">
                            <span>Isabella G.</span>
                            <span>🎒</span>
                          </div>
                          <div className="text-[9px] text-[#8c6d71]">Saldo: <strong className="text-emerald-800 font-bold font-mono">$18.500 COP</strong></div>
                        </div>
                      </div>
                      <div className="nequi-gradient text-[8px] text-white px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-xs font-mono">
                        <span>Nequi 💚</span>
                      </div>
                    </div>

                    {/* Lunchbox graphic slider */}
                    <div className="my-3 flex-1 overflow-y-auto space-y-3 pr-1">
                      
                      {/* Active Lunchbox Card (Warm style) */}
                      <div className="bg-[#f0fbf4] border border-emerald-200 p-3 rounded-2xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-extrabold text-emerald-700 text-[10px] uppercase tracking-wider block font-mono">🥗 Lonchera del Lunes</span>
                          <span className="bg-emerald-100 text-emerald-850 px-2 py-0.5 rounded-full text-[9px] font-bold">¡Nutritiva!</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-emerald-100 shadow-xs">
                            <span className="text-xl">🍓</span>
                            <div className="flex-1 text-left">
                              <h4 className="font-bold text-[#5c3a3e] text-[9.5px]">Salpicón de Frutas</h4>
                              <p className="text-[8px] text-emerald-600 font-medium">Libre de sellos de advertencia</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-emerald-100 shadow-xs">
                            <span className="text-xl">🍪</span>
                            <div className="flex-1 text-left">
                              <h4 className="font-bold text-[#5c3a3e] text-[9.5px]">Galletas de Avena</h4>
                              <p className="text-[8px] text-emerald-500 font-semibold">Arándanos & Miel Natural</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* QR Code Container (Cute child layout) */}
                      <div className="bg-[#fff9f4] border border-[#f7e3d7] p-3 rounded-2xl flex flex-col items-center justify-center space-y-2 shadow-xs">
                        <span className="text-[10px] text-[#5c3a3e] text-center font-bold flex items-center gap-1">
                          <span>Código QR Escolar</span>
                          <span>✨</span>
                        </span>
                        <div className="h-24 w-24 bg-white border-2 border-dashed border-emerald-500/40 rounded-xl p-2 flex items-center justify-center relative qr-glow">
                          <QrCode className="h-full w-full text-emerald-600" />
                          <div className="absolute bg-emerald-600 px-2 py-0.5 text-[8px] font-black text-white rounded-full shadow-md -bottom-1 whitespace-nowrap">
                            Isabella G. 🧸
                          </div>
                        </div>
                        <span className="text-[8px] text-[#8c6d71] text-center font-semibold">Trazabilidad de alergias activa</span>
                      </div>

                    </div>

                    {/* Mock Push Notification */}
                    <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl shadow-md border border-emerald-150 flex items-start gap-2 animate-bounce">
                      <div className="bg-emerald-500 p-1 rounded-lg text-white">
                        <Check className="h-3 w-3 stroke-[3px]" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-[9px]">¡Merienda entregada con éxito!</div>
                        <div className="text-[8.5px] text-[#7d5d61] leading-tight font-sans">Isabella retiró su canastita de merienda. ¡Te notificamos para tu tranquilidad!</div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Floating cute accents */}
                <div className="absolute -top-4 -right-4 bg-[#ffd275] text-[#5c3a3e] px-4 py-2 rounded-2xl font-display font-black text-sm rotate-6 shadow-md border border-[#fef08a] animate-pulse">
                  ¡100% Amor! 🍓🍉
                </div>
                <div className="absolute -bottom-6 -left-4 bg-white text-[#7d5d61] px-4 py-3 rounded-2xl font-sans text-xs font-bold shadow-md border border-[#f7e3d7] flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <span>Alérgenos protegidos por Mamá</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Real-time Interactive Feature: Colombia's Ley 2120 Warning Seal Simulator */}
        <section className="py-20 bg-[#fffdfa] border-y border-[#faeae1]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 bg-[#fef9c3] text-[#854d0e] px-3 py-1 rounded-full text-xs font-bold border border-yellow-250">
                <Star className="h-4 w-4 fill-current text-yellow-500 animate-spin" />
                <span>Simulador Interactivo de Nutrición</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#4e2f33] leading-tight tracking-tight">
                Aprende a cuidar a tus pequeños con nuestro semáforo de nutrición
              </h2>
              <p className="text-[#61494c] text-sm">
                Caspete lee y previene de forma automática. <strong className="text-emerald-600">Haz la prueba haciendo clic en cualquier producto</strong> para ver cómo protegemos a tus hijos de ingredientes excesivos:
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">
              
              {/* Left selector - typical foods in school stores (Warm, sweet design) */}
              <div className="md:col-span-5 bg-white p-6 rounded-[2rem] border border-[#f7e3d7] space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-sm font-black text-[#5c3a3e] mb-4 flex items-center gap-2 border-b border-[#faeae1] pb-3 text-left">
                    <UtensilsCrossed className="h-4 w-4 text-emerald-500" />
                    <span>Selecciona un Alimento:</span>
                  </h3>
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {COLOMBIAN_FOOD_ITEMS.map((food) => (
                      <button
                        key={food.id}
                        onClick={() => selectTestFood(food)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group cursor-pointer ${
                          testFood.id === food.id
                            ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-200'
                            : 'border-[#faeae1] hover:border-emerald-250 bg-white hover:bg-zinc-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl bg-[#fff9f4] p-1.5 rounded-lg border border-[#f7e3d7]">{food.image}</span>
                          <div>
                            <div className="font-black text-[#4e2f33] text-xs transition-colors group-hover:text-emerald-600">{food.name}</div>
                            <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide inline-block mt-0.5 ${
                              food.isHealthy 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {food.isHealthy ? 'Sano ✅' : 'Procesado ⚠️'}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right scanner review - detailed analysis display */}
              <div className="md:col-span-7 bg-white p-7 rounded-[2rem] border border-[#f7e3d7] flex flex-col justify-between space-y-6 text-left">
                
                {/* Product Profile */}
                <div className="space-y-4 flex-1">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Lectura y Análisis Caspete</span>
                      <h3 className="font-display text-2xl font-black text-[#4e2f33] mt-1">{testFood.name}</h3>
                    </div>
                    <span className="text-4xl p-4 bg-emerald-50 rounded-2xl border border-emerald-100">{testFood.image}</span>
                  </div>

                  {/* Colombia Octagonal Seals */}
                  <div className="py-4 border-y border-[#faeae1]">
                    <span className="text-xs font-bold text-[#8c6d71] uppercase tracking-wider block mb-3 font-mono">Advertencias Nutricionales Frontales (Ley 2120):</span>
                    {testFood.seals.length > 0 ? (
                      <div className="flex flex-wrap gap-2.5">
                        {testFood.seals.map((seal, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-[#3f3030] text-white font-mono px-3 py-2 rounded-xl text-xs font-black select-none shadow-sm border border-zinc-700">
                            <AlertTriangle className="h-3.5 w-3.5 text-yellow-300" />
                            <span>EXCESO EN {seal.toUpperCase()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl text-xs font-bold">
                        <Check className="h-4.5 w-4.5 bg-emerald-500 text-white rounded-full p-0.5 flex-shrink-0" />
                        <div>
                          <span>¡Excelente opción para la lonchera! Alimento Seguro.</span>
                          <p className="font-medium text-[#61494c] mt-0.5">Libre de sellos de advertencia del Ministerio de Salud. Perfecto para tus hijos.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Details list */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-[#8c6d71] font-bold uppercase font-mono tracking-wider">Ingredientes que contiene:</span>
                      <p className="text-xs text-[#4e2f33] font-medium mt-1">{testFood.ingredients.join(', ')}</p>
                    </div>
                    <div>
                      <span className="text-xs text-[#8c6d71] font-bold uppercase font-mono tracking-wider">Alérgenos identificados:</span>
                      <p className="text-xs text-emerald-800 font-bold mt-1">{testFood.allergens.length > 0 ? testFood.allergens.join(', ').toUpperCase() : 'Ninguno registrado'}</p>
                    </div>
                  </div>
                </div>

                {/* Caspete Recommendation Rule Box */}
                <div className={`p-4 rounded-2xl border ${
                  testFood.isHealthy 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl ${testFood.isHealthy ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-100 text-emerald-850'}`}>
                      <Smile className="h-4 w-4 fill-current text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-extrabold text-sm text-[#4e2f33]">
                        {testFood.isHealthy 
                          ? '¡Aprobado con Sello de Amor!' 
                          : 'Filtro Automático Escolar'}
                      </h4>
                      <p className="text-xs font-semibold mt-1 text-[#61494c] leading-relaxed">
                        {testFood.isHealthy 
                          ? 'Este refrigerio saludable puede ser comprado libremente por los chiquitos en el descanso, aportando energía natural recomendada.' 
                          : 'Si como madre bloqueas los snacks chatarra, el sistema impedirá que el cajero le entregue este snack en la cafetería, y le recomendará una nutritiva "Porción de Fruta picada" para mantener una conducta saludable.'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* Bento Grid: Core Value Proposition Pillars */}
        <section className="py-20 bg-[#fdf8f4]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center space-y-4">
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#4e2f33] leading-tight tracking-tight">
                Uniendo a la comunidad escolar con cariño y tecnología
              </h2>
              <p className="text-[#61494c] text-sm">
                Caspete es un puente dulce e inteligente entre madres protectoras que cuidan el hogar, profesores comprometidos y administradores de la cafetería escolar.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
              
              {/* Bento Card 1: Parents */}
              <div className="bg-white p-8 rounded-[2rem] border border-[#f7e3d7] flex flex-col justify-between space-y-8 relative overflow-hidden group hover:border-emerald-300/30 transition-all text-left animate-fade-in">
                <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md font-bold">
                    <Heart className="h-6 w-6 fill-current text-white" />
                  </div>
                  <h3 className="font-display text-2.5xl font-black text-[#4e2f33]">Para Mamás y Papás</h3>
                  <ul className="space-y-3 text-xs text-[#61494c] font-semibold">
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Programa las loncheras de forma semanal</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Controla el bolsillo familiar directo Nequi</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Filtros instantáneos de alergias y chatarra</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Alertas SMS en tiempo real de lo consumido</span>
                    </li>
                  </ul>
                </div>
                <Link 
                  to="/register"
                  className="w-full py-3.5 rounded-xl border border-[#faeae1] bg-[#fffaf6] hover:bg-emerald-50 text-emerald-805 font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider text-decoration-none"
                >
                  <span>Crear mi Cuenta de Padre</span>
                  <ChevronRight className="h-4 w-4 text-emerald-500" />
                </Link>
              </div>

              {/* Bento Card 2: Operators / Cashier */}
              <div className="bg-white p-8 rounded-[2rem] border border-[#f7e3d7] flex flex-col justify-between space-y-8 relative overflow-hidden group hover:border-emerald-300/30 transition-all text-left">
                <div className="absolute top-0 right-0 h-24 w-24 bg-teal-500/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-400 text-white flex items-center justify-center shadow-md font-bold">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-2.5xl font-black text-[#4e2f33]">Para la Cafetería</h3>
                  <ul className="space-y-3 text-xs text-[#61494c] font-semibold">
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Descuento QR ultra ágil e intuitivo</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Evita fraude y robos de efectivo escolar</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Bloquea automáticamente ingredientes alérgenos</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Conciliación inmediata de Caja sin monedas</span>
                    </li>
                  </ul>
                </div>
                <Link 
                  to="/login"
                  className="w-full py-3.5 rounded-xl border border-[#faeae1] bg-[#fffaf6] hover:bg-emerald-50 text-emerald-805 font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider text-decoration-none"
                >
                  <span>Entrar al POS Cafetería</span>
                  <ChevronRight className="h-4 w-4 text-teal-500" />
                </Link>
              </div>

              {/* Bento Card 3: Institutions */}
              <div className="bg-emerald-50/20 p-8 rounded-[2rem] border border-emerald-250 flex flex-col justify-between space-y-8 relative overflow-hidden group hover:border-emerald-300/30 transition-all text-left">
                <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                    <School className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-2.5xl font-black text-[#4e2f33]">Para el Colegio</h3>
                  <ul className="space-y-3 text-xs text-[#61494c] font-semibold">
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span>Entornos escolares 100% tecnológicos</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span>Certificación nacional de colegio saludable</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span>Elimina bullying o robos de efectivo escolar</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span>Auditoría de nutrición avalada por expertos</span>
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => openModal('MONTHLY')}
                  className="w-full py-3.5 rounded-xl border border-emerald-250 bg-emerald-100/50 hover:bg-emerald-100 text-emerald-805 font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                >
                  <span>Solicitar Demo de Colegio</span>
                  <ChevronRight className="h-4 w-4 text-emerald-600" />
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* How it Works Section - Soft pastels step circles */}
        <section className="py-20 bg-[#fffcf9] border-t border-[#faeae1]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center space-y-4">
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#4e2f33] leading-tight tracking-tight">
                ¿Cómo funciona el ecosistema Caspete?
              </h2>
              <p className="text-[#61494c] text-sm">
                Transformamos la merienda en un proceso lúdico, rápido, amigable y lleno de cariño en 3 simples pasos.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-12 relative text-left">
              
              {/* Step 1 */}
              <div className="flex flex-col items-start space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-450 text-emerald-800 flex items-center justify-center font-display font-black text-xl shadow-xs">
                  <span>1</span>
                </div>
                <h3 className="font-display text-xl font-bold text-[#4e2f33]">🍎 Recarga y Cuida</h3>
                <p className="text-xs text-[#61494c] font-medium leading-relaxed">
                  Recarga tranquilamente por Nequi en segundos, pre-configura las alergias del menor y fija un presupuesto diario máximo para su cuidado.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-start space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#ffe8cc] border border-[#fdba74] text-[#c2410c] flex items-center justify-center font-display font-black text-xl shadow-xs">
                  <span>2</span>
                </div>
                <h3 className="font-display text-xl font-bold text-[#4e2f33]">🥪 Programa Semanal</h3>
                <p className="text-xs text-[#61494c] font-medium leading-relaxed">
                  Elige de forma amigable los refrigerios para cada día según tus preferencias. Bloquea chucherías procesadas con ayuda del semáforo tierno.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-start space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#dcfce7] border border-[#4ade80] text-[#15803d] flex items-center justify-center font-display font-black text-xl shadow-xs">
                  <span>3</span>
                </div>
                <h3 className="font-display text-xl font-bold text-[#4e2f33]">🎁 Entrega con Sonrisa</h3>
                <p className="text-xs text-[#61494c] font-medium leading-relaxed">
                  El operario escanea el carné con el código QR tierno, comprueba restricciones al instante y entrega la lonchera con una hermosa sonrisa.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Pricing / Plan Modalities for Schools */}
        <section className="py-20 bg-[#fffdfa] border-t border-[#faeae1]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
              <span className="text-emerald-700 text-xs font-extrabold tracking-widest uppercase block font-mono">Precios Claros</span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#4e2f33] leading-tight tracking-tight">
                Elige la modalidad ideal para tu institución
              </h2>
              <p className="text-[#61494c] text-sm">
                Dos formas sencillas de trabajar con Caspete. Ambas opciones incluyen la totalidad de las funciones de la plataforma.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
              
              {/* Commission Plan */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-[#f7e3d7] flex flex-col justify-between space-y-8 relative overflow-hidden group hover:border-emerald-250 transition-all text-left">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-4xl">📊</span>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-150 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest">Sin Costo Fijo</span>
                  </div>
                  <h3 className="font-display text-2xl font-black text-[#4e2f33] mb-3">Modalidad por Comisión</h3>
                  <p className="text-[#61494c] text-xs leading-relaxed mb-6 font-semibold">
                    Caspete cobra un porcentaje mínimo por cada transacción procesada. Sin mensualidades fijas. Perfecto para colegios que desean digitalizar su comedor sin ningún riesgo financiero.
                  </p>
                  <ul className="space-y-3.5 text-xs text-[#61494c] font-bold">
                    <li className="flex items-center gap-x-2.5">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Sin cobros fijos mensuales</span>
                    </li>
                    <li className="flex items-center gap-x-2.5">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Paga solo sobre lo que se consuma</span>
                    </li>
                    <li className="flex items-center gap-x-2.5">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Incluye carné digital QR gratis</span>
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => openModal('COMMISSION')}
                  className="w-full py-4 rounded-2xl text-emerald-805 font-display font-black text-xs uppercase tracking-widest border border-emerald-250 bg-emerald-50/30 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer text-center"
                >
                  Solicitar Información
                </button>
              </div>

              {/* Monthly Subscription Plan */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-[#f7e3d7] flex flex-col justify-between space-y-8 relative overflow-hidden group hover:border-emerald-250 transition-all text-left">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-4xl">👑</span>
                    <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest">Suscripción Fija</span>
                  </div>
                  <h3 className="font-display text-2xl font-black text-[#4e2f33] mb-3">Suscripción Institucional</h3>
                  <p className="text-[#61494c] text-xs leading-relaxed mb-6 font-semibold">
                    Una tarifa fija mensual adaptada al número de estudiantes de tu institución, con 0% de comisiones por transacciones. Excelente para colegios grandes con alto flujo de recargas.
                  </p>
                  <ul className="space-y-3.5 text-xs text-[#61494c] font-bold">
                    <li className="flex items-center gap-x-2.5">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>0% de comisión por venta</span>
                    </li>
                    <li className="flex items-center gap-x-2.5">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Teneduría de libros y reportes SIC avanzados</span>
                    </li>
                    <li className="flex items-center gap-x-2.5">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Soporte prioritario 24/7 en Colombia</span>
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => openModal('MONTHLY')}
                  className="w-full py-4 rounded-2xl text-white font-display font-black text-xs uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 transition-all cursor-pointer text-center"
                >
                  Solicitar Información
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* General FAQ Section - Cozy questions with emojis */}
        <section className="py-20 bg-[#fdf8f4] border-t border-[#faeae1] pb-20">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="text-center space-y-4 mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#4e2f33] leading-tight tracking-tight">
                Respuestas con Cariño (Preguntas Frecuentes)
              </h2>
              <p className="text-[#61494c] text-sm">
                ¿Tienes dudas sobre cómo implementar Caspete o cómo cuidamos de tus pequeños? Aquí respondemos a todas tus inquietudes como madre.
              </p>
            </div>

            <div className="space-y-3 pt-4 text-left">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-2xl border border-[#faeae1] p-4 shadow-xs">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex justify-between items-center text-left font-display font-bold text-[#4e2f33] hover:text-emerald-600 transition-colors text-base sm:text-lg focus:outline-none cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="text-emerald-500 font-bold text-xl ml-4 font-mono">
                      {openFaq === index ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === index && (
                    <p className="text-[#61494c] font-medium text-xs leading-relaxed pt-3 pl-1 border-t border-[#faeae1] mt-3 animate-fade-in text-left font-sans">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final Action Banner CTA */}
        <section className="py-20 bg-gradient-to-b from-[#fffbf8] to-[#edfbf3] border-t border-[#faeae1] relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent blur-3xl -z-10" />
          <div className="mx-auto max-w-5xl px-6 text-center space-y-8 relative z-10">
            <h2 className="font-display text-3xl sm:text-4xl font-black text-[#4e2f33] max-w-2xl mx-auto tracking-tight leading-tight">
              ¿Lista para probar el Caspete favorito de las mamás colombianas?
            </h2>
            <p className="text-[#61494c] max-w-lg mx-auto text-sm leading-relaxed font-semibold">
              Te garantizamos un descanso escolar sano, rápido, lleno de trazabilidad y completamente libre de preocupaciones familiares.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-4 max-w-md mx-auto">
              <Link
                to="/register"
                className="px-8 py-4 rounded-2xl text-white font-display font-black text-sm bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 cursor-pointer text-decoration-none"
              >
                <span>¡Comenzar mi Registro Gratis!</span>
                <Sparkles className="h-5 w-5 fill-current text-white" />
              </Link>
            </div>
          </div>
        </section>

        {/* Lead Form Modal */}
        {leadModal && (
          <div 
            onClick={e => { if (e.target === e.currentTarget) setLeadModal(null); }} 
            className="fixed inset-0 z-[9999] bg-[#0c1c14]/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          >
            <div className="bg-white border border-[#faeae1] rounded-[2rem] p-8 sm:p-10 w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl relative text-left">
              
              {sent ? (
                <div className="text-center py-10 space-y-4">
                  <div className="text-6xl animate-bounce">🎉</div>
                  <h3 className="font-display text-2xl font-black text-emerald-600">¡Datos Recibidos con Amor!</h3>
                  <p className="text-xs text-[#61494c] leading-relaxed mb-6 font-semibold">
                    Muchas gracias por confiar en nosotros. Nuestro equipo te contactará en menos de 24 horas hábiles para coordinar la demostración personalizada para el colegio de tu pequeño.
                  </p>
                  <button 
                    onClick={() => setLeadModal(null)} 
                    className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-650 font-display font-black text-xs uppercase tracking-widest text-white transition-all cursor-pointer border-none shadow-md"
                  >
                    Cerrar Ventana
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-6 border-b border-[#faeae1] pb-4">
                    <div>
                      <h3 className="font-display text-2xl font-black text-[#4e2f33] flex items-center gap-2">
                        <span>🎒 Solicitar Información</span>
                      </h3>
                      <p className="text-xs text-[#8c6d71] mt-1 font-mono font-bold">
                        Plan de Interés: <span className="text-emerald-700 font-extrabold">{leadModal === 'COMMISSION' ? 'Comisión transaccional' : 'Tarifa fija mensual'}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => setLeadModal(null)} 
                      className="bg-transparent border-none text-2xl cursor-pointer text-[#8c6d71] hover:text-[#4e2f33] transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={submitLead} className="space-y-4 text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">Nombre del Colegio *</label>
                        <input 
                          required 
                          type="text"
                          value={form.school_name} 
                          onChange={e => setForm(f => ({ ...f, school_name: e.target.value.replace(/[^A-Za-z0-9À-ÿ\s.,#&'-]/g, '') }))} 
                          placeholder="Colegio San José"
                          className="w-full bg-[#fffbf8] border border-[#faeae1] rounded-xl px-4 py-3 text-xs text-[#3f2e2e] placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">NIT del Colegio</label>
                        <input 
                          type="text"
                          value={form.nit} 
                          onChange={e => setForm(f => ({ ...f, nit: e.target.value.replace(/[^0-9.-]/g, '') }))} 
                          placeholder="900.123.456-1"
                          className="w-full bg-[#fffbf8] border border-[#faeae1] rounded-xl px-4 py-3 text-xs text-[#3f2e2e] placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">Ciudad *</label>
                        <input 
                          required 
                          type="text"
                          value={form.city} 
                          onChange={e => setForm(f => ({ ...f, city: e.target.value.replace(/[^A-Za-zÀ-ÿ\s'-]/g, '') }))} 
                          placeholder="Bogotá"
                          className="w-full bg-[#fffbf8] border border-[#faeae1] rounded-xl px-4 py-3 text-xs text-[#3f2e2e] placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">N° de Estudiantes Aprox.</label>
                        <input 
                          type="text" 
                          value={form.students_count} 
                          onChange={e => setForm(f => ({ ...f, students_count: e.target.value.replace(/\D/g, '') }))} 
                          placeholder="350"
                          className="w-full bg-[#fffbf8] border border-[#faeae1] rounded-xl px-4 py-3 text-xs text-[#3f2e2e] placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">Nombre del Rector / Encargado *</label>
                      <input 
                        required 
                        type="text"
                        value={form.contact_name} 
                        onChange={e => setForm(f => ({ ...f, contact_name: e.target.value.replace(/[^A-Za-zÀ-ÿ\s'.]/g, '') }))} 
                        placeholder="Dr. Carlos Rodríguez"
                        className="w-full bg-[#fffbf8] border border-[#faeae1] rounded-xl px-4 py-3 text-xs text-[#3f2e2e] placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">Correo Electrónico *</label>
                        <input 
                          required 
                          type="email"
                          value={form.contact_email} 
                          onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} 
                          placeholder="rector@colegio.edu.co"
                          className="w-full bg-[#fffbf8] border border-[#faeae1] rounded-xl px-4 py-3 text-xs text-[#3f2e2e] placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">Teléfono / WhatsApp</label>
                        <input 
                          type="text"
                          value={form.contact_phone} 
                          onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value.replace(/[^0-9+\s()-]/g, '') }))} 
                          placeholder="3001234567"
                          className="w-full bg-[#fffbf8] border border-[#faeae1] rounded-xl px-4 py-3 text-xs text-[#3f2e2e] placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">Mensaje Adicional</label>
                        <span className="text-[10px] text-zinc-500 font-mono">{(form.message ?? '').length} / 200</span>
                      </div>
                      <textarea 
                        rows={3} 
                        maxLength={200}
                        value={form.message} 
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))} 
                        placeholder="Cuéntanos brevemente cuáles son las necesidades del comedor escolar..."
                        className="w-full bg-[#fffbf8] border border-[#faeae1] rounded-xl px-4 py-3 text-xs text-[#3f2e2e] placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors resize-none font-bold"
                      />
                    </div>

                    {formError && <p className="text-rose-500 text-xs font-semibold">{formError}</p>}
                    
                    <button 
                      type="submit" 
                      disabled={sending} 
                      className="w-full py-4 rounded-xl text-white font-display font-black text-xs uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none shadow-md"
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
      <footer className="bg-[#0c1c14] text-[#cbdcd0] py-16 border-t border-emerald-950 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-550 text-white flex items-center justify-center font-bold">
                <Smile className="h-5 w-5 fill-current" />
              </div>
              <span className="font-display font-black text-xl text-white tracking-tight">
                Caspete<span>🥦</span>
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
              <a href="mailto:hola@caspete.co" className="text-[#cbdcd0] hover:text-white text-decoration-none font-bold">hola@caspete.co</a>
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

    </div>
  );
}
