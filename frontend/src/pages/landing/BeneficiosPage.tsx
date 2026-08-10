import { Link } from 'react-router-dom';
import {
  Heart, ChevronRight, Check, School, QrCode,
  ShieldCheck, AlertTriangle, ClipboardCheck, MapPin, Lock,
  MessageCircle, GraduationCap, BarChart3, Percent,
} from 'lucide-react';
import { useLeadModal } from '../../components/landing/LeadModalProvider';

const SCHOOL_BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'Cero efectivo en manos de los niños',
    description: 'Elimina el riesgo de robos, extravíos y peleas por dinero físico dentro de la institución.',
  },
  {
    icon: ClipboardCheck,
    title: 'Cumplimiento Ley 2120 automático',
    description: 'Clasificación nutricional y sellos de advertencia calculados por pedido, con auditoría de cada cambio — evidencia lista para mostrar a padres o entes de control.',
  },
  {
    icon: AlertTriangle,
    title: 'Control de alergias por estudiante',
    description: 'La plataforma bloquea automáticamente productos con alérgenos declarados, sin depender de que alguien recuerde revisarlo a mano.',
  },
  {
    icon: MapPin,
    title: 'Rastreo GPS opcional en horario escolar',
    description: 'Tranquilidad para las familias en el trayecto casa-colegio, con consentimiento específico de los padres y sin recopilar ubicación fuera de la jornada.',
  },
  {
    icon: QrCode,
    title: 'Asistencia por QR integrada',
    description: 'El docente registra la llegada a clase escaneando la misma tarjeta del estudiante — sin hardware ni procesos adicionales que administrar.',
  },
  {
    icon: Lock,
    title: 'Protección de datos Ley 1581/2012',
    description: 'Consentimientos granulares, derechos ARCO y anonimización automática — reduce el riesgo legal del colegio frente al manejo de datos de menores.',
  },
  {
    icon: MessageCircle,
    title: 'Comunicación directa con las familias',
    description: 'Comunicados oficiales y chat interno entre la cafetería y los padres para resolver novedades de pedidos en tiempo real.',
  },
  {
    icon: GraduationCap,
    title: 'Módulo académico incluido',
    description: 'Gestión de cursos, calificaciones y comunicados en la misma plataforma — no es solo control de loncheras, es una herramienta escolar completa.',
  },
  {
    icon: BarChart3,
    title: 'Reportes y trazabilidad total',
    description: 'Saldo, ventas y consumo nutricional por estudiante, por curso o para todo el colegio, disponibles en cualquier momento.',
  },
  {
    icon: Percent,
    title: 'Sin costo de implementación',
    description: 'Se integra con la tienda escolar que ya tienen, con dos modelos comerciales a elegir: comisión por transacción o tarifa mensual fija — sin inversión inicial.',
  },
];

export default function BeneficiosPage() {
  const { openLeadModal } = useLeadModal();

  return (
    <>
      {/* Page intro */}
      <section className="pt-16 pb-4">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-x-2 text-xs font-bold text-emerald-805 bg-emerald-100/60 px-3.5 py-2 rounded-full border border-emerald-250">
            <Heart className="h-4 w-4" />
            <span>NUESTROS BENEFICIOS</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#4e2f33] leading-tight tracking-tight">
            Uniendo a la comunidad escolar con cariño y tecnología
          </h1>
          <p className="text-[#61494c] text-sm">
            Kidway es un puente dulce e inteligente entre madres protectoras que cuidan el hogar, profesores comprometidos y administradores de la cafetería escolar.
          </p>
        </div>
      </section>

      {/* Bento Grid: Core Value Proposition Pillars */}
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">

            {/* Bento Card 1: Parents */}
            <div className="bg-white p-8 rounded-[2rem] border border-[#f7e3d7] flex flex-col justify-between space-y-8 relative overflow-hidden group hover:border-emerald-300/30 transition-all text-left">
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
                  <li className="flex items-center gap-x-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>📍 Ubicación GPS de tu hijo en el trayecto casa-colegio</span>
                  </li>
                  <li className="flex items-center gap-x-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>📞 Llamadas directas con tu hijo desde su localizador</span>
                  </li>
                  <li className="flex items-center gap-x-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>📍 Batería, señal y última ubicación conocida en vivo</span>
                  </li>
                  <li className="flex items-center gap-x-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>📍 Activa rastreo extendido fuera del horario escolar cuando lo necesites</span>
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
                onClick={() => openLeadModal('COMMISSION')}
                className="w-full py-3.5 rounded-xl border border-emerald-250 bg-emerald-100/50 hover:bg-emerald-100 text-emerald-805 font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
              >
                <span>Solicitar Demo de Colegio</span>
                <ChevronRight className="h-4 w-4 text-emerald-600" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Beneficios detallados para el colegio */}
      <section className="py-20 bg-[#fffcf9] border-y border-[#faeae1]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <div className="inline-flex items-center gap-x-2 text-xs font-bold text-emerald-805 bg-emerald-100/60 px-3.5 py-2 rounded-full border border-emerald-250">
              <School className="h-4 w-4" />
              <span>PARA INSTITUCIONES EDUCATIVAS</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#4e2f33] leading-tight tracking-tight">
              Todo lo que gana tu colegio con Kidway
            </h2>
            <p className="text-[#61494c] text-sm">
              Una sola plataforma para seguridad, cumplimiento normativo, comunicación con las familias y control académico — sin reemplazar a la tienda escolar que ya tienen.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SCHOOL_BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="bg-white p-7 rounded-[1.75rem] border border-[#f7e3d7] flex flex-col gap-4 hover:border-emerald-300/30 hover:shadow-sm transition-all text-left"
                >
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-display text-base font-bold text-[#4e2f33] leading-snug">
                      {benefit.title}
                    </h3>
                    <p className="text-xs text-[#61494c] leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => openLeadModal('COMMISSION')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-xs uppercase tracking-wider font-extrabold transition-all bg-emerald-500 hover:bg-emerald-600 text-white shadow-md cursor-pointer"
            >
              <span>Solicitar Demo para mi Colegio</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
