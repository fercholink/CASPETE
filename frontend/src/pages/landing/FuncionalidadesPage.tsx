import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles, UtensilsCrossed, AlertTriangle, Check, Star, Smile,
  MapPin, Phone, Radio, BatteryCharging, Navigation, RefreshCw,
} from 'lucide-react';
import { useLeadModal } from '../../components/landing/LeadModalProvider';
import { useGpsOrderModal } from '../../components/landing/GpsOrderModalProvider';
import { COLOMBIAN_FOOD_ITEMS } from '../../data/landingMockData';
import type { FoodItem } from '../../data/landingMockData';

const FAQS = [
  {
    q: '💝 ¿Cómo se implementa Kidway en el colegio de mis hijos?',
    a: '¡Es muy sencillo y con total acompañamiento! El colegio se registra en nuestra red, habilitamos el menú digital seguro supervisado por expertos y les damos a las mamás y papás acceso inmediato para recargar saldo cómodamente por Nequi para programar las loncheras con mucho amor de forma semanal.',
  },
  {
    q: '🎒 Mi hijo pequeño no tiene celular, ¿cómo compra su lonchera?',
    a: '¡No te preocupes, no necesitan tecnología en sus manitas! Puedes imprimir un código QR tierno en un carné escolar, guardarlo en su cartuchera o utilizar una linda pulserita de silicona. El operario lo escanea con amor en la tablet de Kidway, garantizando una entrega segura sin monedas sucias.',
  },
  {
    q: '🥦 ¿Cómo ayuda Kidway con los Sellos de Advertencia (Ley 2120 de comida saludable)?',
    a: 'Al programar la comida semanal de tus pequeños, te mostraremos de forma muy intuitiva los octágonos de advertencia de alimentos procesados (como altos azúcares o sodio). Podrás descartarlos con un solo toque y elegir opciones mágicas y dulces como frutas frescas o arepitas saludables.',
  },
  {
    q: '🏦 ¿Es fácil recargar el saldo escolar para mis pequeños?',
    a: '¡Así es, mamá! Sincronizamos de forma segura con Nequi y PSE en Colombia. Puedes recargar montos pequeños (desde $5.000 COP) sin cobros extra ocultos. Es como darles el dinero diario para el descanso, pero limpio, seguro y controlado con cariño.',
  },
  {
    q: '🔒 ¿Están seguros los datos y la foto de mi hijo de acuerdo a la ley?',
    a: 'Totalmente. La privacidad de tus tesoros es sagrada. En conformidad con la Ley 1581 (Habeas Data de Colombia), toda la información, fotitos y alergias están blindadas y cifradas. Solo tú y el personal autorizado encargado de entregar el refrigerio pueden verlas.',
  },
];

const DEVICE_SPECS = [
  { icon: Radio, label: 'Red 4G CAT-1 + 2G GSM', desc: 'Cobertura confiable en toda Colombia, incluso en zonas rurales.' },
  { icon: MapPin, label: 'Ubicación por GPS + WiFi + Torres celulares', desc: 'Combina varias fuentes para ubicar al niño incluso sin señal GPS directa.' },
  { icon: Phone, label: 'Llamadas de voz y botón SOS', desc: 'Micrófono y parlante integrados para hablar en tiempo real con tu hijo.' },
  { icon: Navigation, label: 'Geocercas y recorrido histórico', desc: 'Define zonas seguras y revisa el camino que hizo tu hijo cualquier día.' },
  { icon: BatteryCharging, label: 'Batería de 1500 mAh', desc: 'Varios días de uso normal con una sola carga.' },
  { icon: RefreshCw, label: 'Actualización remota de firmware', desc: 'El dispositivo se mantiene al día sin que tengas que hacer nada.' },
];

interface GalleryImage { id: string; image_url: string; caption: string | null }

export default function FuncionalidadesPage() {
  const { openLeadModal } = useLeadModal();
  const { openGpsOrderModal } = useGpsOrderModal();
  const location = useLocation();
  const [testFood, setTestFood] = useState<FoodItem>(COLOMBIAN_FOOD_ITEMS[0]); // default Salpicon (healthy & delicious)
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  // Ancla directa desde el menú ("Precios") — baja suave hasta la sección al cargar
  useEffect(() => {
    if (location.hash === '#precios') {
      document.getElementById('precios')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  // Galería administrable desde el panel SUPER_ADMIN — sin auth, pública
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const url = baseUrl.endsWith('/api') ? `${baseUrl}/gps-gallery/public` : `${baseUrl}/api/gps-gallery/public`;
    fetch(url)
      .then((r) => r.json())
      .then((json: { success: boolean; data?: GalleryImage[] }) => setGalleryImages(json.data ?? []))
      .catch(() => {});
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <>
      {/* Cómo funciona el localizador GPS */}
      <section className="pt-16 pb-20 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <div className="inline-flex items-center gap-x-2 text-xs font-bold text-emerald-805 bg-emerald-100/60 px-3.5 py-2 rounded-full border border-emerald-250">
              <MapPin className="h-4 w-4" />
              <span>UBICACIÓN Y LLAMADAS</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#4e2f33] leading-tight tracking-tight">
              ¿Cómo funciona el localizador GPS?
            </h2>
            <p className="text-[#61494c] text-sm">
              El localizador captura su ubicación al aire libre y tú la ves al instante desde la app, sin que tu hijo necesite un celular propio.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-12 relative text-left max-w-4xl mx-auto">
            <div className="flex flex-col items-start space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-450 text-emerald-800 flex items-center justify-center font-display font-black text-xl shadow-xs">
                <span>A</span>
              </div>
              <h3 className="font-display text-xl font-bold text-[#4e2f33]">📡 Captura la ubicación</h3>
              <p className="text-xs text-[#61494c] font-medium leading-relaxed">
                El localizador soporta múltiples métodos de ubicación y captura la señal GPS cuando está al aire libre, registrando la posición y el recorrido del trayecto.
              </p>
            </div>
            <div className="flex flex-col items-start space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#dcfce7] border border-[#4ade80] text-[#15803d] flex items-center justify-center font-display font-black text-xl shadow-xs">
                <span>B</span>
              </div>
              <h3 className="font-display text-xl font-bold text-[#4e2f33]">📲 Tú lo ves desde la app</h3>
              <p className="text-xs text-[#61494c] font-medium leading-relaxed">
                Como padre, ves la ubicación en tiempo real, el historial del recorrido y el estado del localizador directamente desde la app de Kidway — sin costos extra.
              </p>
            </div>
          </div>

          {/* Grid de especificaciones del dispositivo */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {DEVICE_SPECS.map((spec) => {
              const Icon = spec.icon;
              return (
                <div
                  key={spec.label}
                  className="bg-[#fffcf9] p-6 rounded-[1.75rem] border border-[#f7e3d7] flex flex-col gap-3 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display text-sm font-bold text-[#4e2f33] leading-snug">{spec.label}</h4>
                    <p className="text-xs text-[#61494c] leading-relaxed">{spec.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Galería de fotos del localizador (administrable desde el panel SUPER_ADMIN) */}
          {galleryImages.length > 0 && (
            <div className="mt-16 max-w-5xl mx-auto">
              <div className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x snap-mandatory">
                {galleryImages.map((img) => (
                  <figure
                    key={img.id}
                    className="flex-shrink-0 w-64 snap-start bg-[#fffcf9] border border-[#f7e3d7] rounded-[1.75rem] overflow-hidden"
                  >
                    <img src={img.image_url} alt={img.caption ?? 'Localizador GPS Kidway'} className="w-full h-56 object-cover" />
                    {img.caption && (
                      <figcaption className="p-4 text-xs text-[#61494c] font-semibold text-left">{img.caption}</figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          )}

          {/* Explicación del botón SOS */}
          <div className="mt-14 max-w-3xl mx-auto bg-[#fef2f2] border border-red-200 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center gap-8 text-left">
            <div className="relative flex-shrink-0">
              <img
                src="/gps-sos.jpg"
                alt="Botón de SOS del localizador GPS Kidway"
                className="w-40 sm:w-48 rounded-2xl shadow-md border border-red-100"
              />
              <div className="absolute -top-3 -left-3 w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md">
                <span className="text-xl">🆘</span>
              </div>
            </div>
            <div>
              <h3 className="font-display text-lg font-black text-[#4e2f33] mb-1">Botón de SOS</h3>
              <p className="text-xs text-[#61494c] leading-relaxed">
                Tu hijo mantiene presionado el botón de SOS por 3 segundos para activar la llamada de pánico: el localizador marca automáticamente al número configurado en la app y se establece una llamada de voz en ambos sentidos, para que puedas escucharlo y hablarle de inmediato.
              </p>
            </div>
          </div>

          {/* Precio del localizador para padres */}
          <div id="precios" className="mt-16 max-w-4xl mx-auto scroll-mt-28">
            <div className="text-center mb-8">
              <span className="text-emerald-700 text-xs font-extrabold tracking-widest uppercase block font-mono">Precio Claro para Padres</span>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#4e2f33] leading-tight tracking-tight mt-2">
                ¿Cuánto cuesta el localizador?
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Dispositivo — pago único */}
              <div className="bg-white p-8 rounded-[2rem] border-2 border-[#f7e3d7] flex flex-col justify-between space-y-6 text-left">
                <div>
                  <span className="text-3xl">📦</span>
                  <h4 className="font-display text-xl font-black text-[#4e2f33] mt-3">Localizador GPS</h4>
                  <p className="text-xs text-[#61494c] font-semibold mt-1">Pago único, es tuyo para siempre.</p>
                  <p className="font-display text-4xl font-black text-[#4e2f33] mt-4">
                    $120.000 <span className="text-sm font-bold text-[#61494c]">COP</span>
                  </p>
                </div>
                <ul className="space-y-2.5 text-xs text-[#61494c] font-bold">
                  <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-emerald-500 flex-shrink-0" /><span>Dispositivo con SIM 4G incluida</span></li>
                  <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-emerald-500 flex-shrink-0" /><span>Batería de 1500 mAh</span></li>
                  <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-emerald-500 flex-shrink-0" /><span>Botón físico de SOS</span></li>
                </ul>
              </div>

              {/* Mensualidad — recomendado */}
              <div className="bg-white p-8 rounded-[2.5rem] border-2 border-emerald-400 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-lg shadow-emerald-500/10 text-left">
                <span className="absolute top-6 right-6 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest">Todo Incluido</span>
                <div>
                  <span className="text-3xl">📍</span>
                  <h4 className="font-display text-xl font-black text-[#4e2f33] mt-3">Plan Mensual</h4>
                  <p className="text-xs text-[#61494c] font-semibold mt-1">Ubicación y llamadas, sin sorpresas.</p>
                  <p className="font-display text-4xl font-black text-[#4e2f33] mt-4">
                    $25.000 <span className="text-sm font-bold text-[#61494c]">COP / mes</span>
                  </p>
                </div>
                <ul className="space-y-2.5 text-xs text-[#61494c] font-bold">
                  <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-emerald-500 flex-shrink-0" /><span>Llamadas ilimitadas a todo destino</span></li>
                  <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-emerald-500 flex-shrink-0" /><span>Geolocalización en tiempo real</span></li>
                  <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-emerald-500 flex-shrink-0" /><span>Sin permanencia — pagas mes a mes</span></li>
                </ul>
              </div>
            </div>
            <p className="text-center text-xs text-[#8c6d71] mt-6 max-w-xl mx-auto">
              No necesitas que tu colegio esté afiliado a Kidway para usar el localizador — regístrate como padre y elige "solo localizar y llamar" al agregar a tu hijo.
            </p>
            <div className="flex justify-center mt-8">
              <button
                onClick={() => openGpsOrderModal()}
                className="py-4 px-10 rounded-2xl text-white font-display font-black text-xs uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 transition-all cursor-pointer text-center shadow-md shadow-emerald-500/25"
              >
                📍 Comprar el Localizador
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Page intro */}
      <section className="pt-16 pb-4">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-[#fef9c3] text-[#854d0e] px-3 py-1 rounded-full text-xs font-bold border border-yellow-250">
            <Star className="h-4 w-4 fill-current text-yellow-500 animate-spin" />
            <span>Funcionalidades de Kidway</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#4e2f33] leading-tight tracking-tight">
            Aprende a cuidar a tus pequeños con nuestro semáforo de nutrición
          </h1>
          <p className="text-[#61494c] text-sm">
            Kidway lee y previene de forma automática. <strong className="text-emerald-600">Haz la prueba haciendo clic en cualquier producto</strong> para ver cómo protegemos a tus hijos de ingredientes excesivos:
          </p>
        </div>
      </section>

      {/* Real-time Interactive Feature: Colombia's Ley 2120 Warning Seal Simulator */}
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">

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
                      onClick={() => setTestFood(food)}
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
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Lectura y Análisis Kidway</span>
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

              {/* Kidway Recommendation Rule Box */}
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

      {/* How it Works Section - Soft pastels step circles */}
      <section className="py-20 bg-[#fffcf9] border-t border-[#faeae1]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#4e2f33] leading-tight tracking-tight">
              ¿Cómo funciona el ecosistema Kidway?
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
              Dos formas sencillas de trabajar con Kidway. Ambas opciones incluyen la totalidad de las funciones de la plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">

            {/* Commission Plan — recomendado */}
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-emerald-400 flex flex-col justify-between space-y-8 relative overflow-hidden group shadow-lg shadow-emerald-500/10 transition-all text-left">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-4xl">📊</span>
                  <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest">Recomendado · Sin Costo Fijo</span>
                </div>
                <h3 className="font-display text-2xl font-black text-[#4e2f33] mb-3">Modalidad por Comisión</h3>
                <p className="text-[#61494c] text-xs leading-relaxed mb-6 font-semibold">
                  Kidway solo cobra un pequeño porcentaje sobre lo que se transaccione en la tienda escolar. Si el colegio no vende, no paga nada — cero riesgo financiero para empezar.
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
                onClick={() => openLeadModal('COMMISSION')}
                className="w-full py-4 rounded-2xl text-white font-display font-black text-xs uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 transition-all cursor-pointer text-center"
              >
                Solicitar Información
              </button>
            </div>

            {/* Monthly Subscription Plan */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-[#f7e3d7] flex flex-col justify-between space-y-8 relative overflow-hidden group hover:border-emerald-250 transition-all text-left">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-4xl">👑</span>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-150 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest">Suscripción Fija</span>
                </div>
                <h3 className="font-display text-2xl font-black text-[#4e2f33] mb-3">Suscripción Institucional</h3>
                <p className="text-[#61494c] text-xs leading-relaxed mb-6 font-semibold">
                  Una tarifa fija mensual adaptada al número de estudiantes de tu institución, con 0% de comisiones por transacciones. Ideal para colegios grandes con alto flujo de recargas que prefieren costo predecible.
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
                onClick={() => openLeadModal('MONTHLY')}
                className="w-full py-4 rounded-2xl text-emerald-805 font-display font-black text-xs uppercase tracking-widest border border-emerald-250 bg-emerald-50/30 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer text-center"
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
              ¿Tienes dudas sobre cómo implementar Kidway o cómo cuidamos de tus pequeños? Aquí respondemos a todas tus inquietudes como madre.
            </p>
          </div>

          <div className="space-y-3 pt-4 text-left">
            {FAQS.map((faq, index) => (
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
            ¿Lista para probar el Kidway favorito de las mamás colombianas?
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
    </>
  );
}
