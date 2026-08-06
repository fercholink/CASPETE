import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, UtensilsCrossed, AlertTriangle, Check, Star, Smile,
} from 'lucide-react';
import { useLeadModal } from '../../components/landing/LeadModalProvider';
import { COLOMBIAN_FOOD_ITEMS } from '../../data/landingMockData';
import type { FoodItem } from '../../data/landingMockData';

const FAQS = [
  {
    q: '💝 ¿Cómo se implementa Kidway en el colegio de mis hijos?',
    a: '¡Es muy sencillo y con total acompañamiento! El colegio se registra en nuestra red, habilitamos el menú digital seguro supervisado por expertos y les damos a las mamás y papás acceso inmediato para recargar saldo cómodamente por Nequi para programar las loncheras con mucho amor de forma semanal.',
  },
  {
    q: '🎒 Mi hijo pequeño no tiene celular, ¿cómo compra su lonchera?',
    a: '¡No te preocupes, no necesitan tecnología en sus manitas! Puedes imprimir un código QR tierno en un carné escolar, guardarlo en su cartuchera o utilizar una linda pulserita de silicona. El operario lo escanea con amor en la tablet del caspete, garantizando una entrega segura sin monedas sucias.',
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

export default function FuncionalidadesPage() {
  const { openLeadModal } = useLeadModal();
  const [testFood, setTestFood] = useState<FoodItem>(COLOMBIAN_FOOD_ITEMS[0]); // default Salpicon (healthy & delicious)
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <>
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
