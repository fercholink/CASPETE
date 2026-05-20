import React, { useState } from 'react';
import { 
  QrCode, 
  CheckCircle, 
  AlertTriangle, 
  Utensils, 
  Search, 
  TrendingUp, 
  Sparkles, 
  User, 
  ArrowLeft,
  BellRing,
  Check,
  Plus,
  Trash2,
  DollarSign
} from 'lucide-react';
import { Child, FoodItem, Transaction } from '../types';
import { COLOMBIAN_FOOD_ITEMS } from '../data/mockData';

interface CanteenDashboardProps {
  children: Child[];
  onUpdateChildren: (children: Child[]) => void;
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  scannedChildId: string | null;
  onClearScannedChildId: () => void;
}

export default function CanteenDashboard({
  children,
  onUpdateChildren,
  transactions,
  onAddTransaction,
  scannedChildId,
  onClearScannedChildId
}: CanteenDashboardProps) {

  // Selected child currently being scanned
  const [selectedChildId, setSelectedChildId] = useState<string | null>(scannedChildId);
  const scannedChildObj = children.find(c => c.id === (selectedChildId || scannedChildId));

  // Scanning simulation state
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<'idle' | 'scanning' | 'details' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Items currently on the tray representing extra purchases
  const [canteenTray, setCanteenTray] = useState<string[]>([]);

  // Simulation warning alerts
  const [smsNotification, setSmsNotification] = useState<string | null>(null);

  // Trigger simulated scan of QR
  const handleSimulateScan = (childId: string) => {
    setIsScanning(true);
    setScanStep('scanning');
    setSelectedChildId(childId);
    setCanteenTray([]); // reset extras tray

    // Simulate laser qr reader camera autofocus delay
    setTimeout(() => {
      setScanStep('details');
      setIsScanning(false);
    }, 1200);
  };

  const getDayName = () => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const todayIndex = new Date().getDay();
    // Default to Lunes if Sunday or Saturday to keep simulator exciting
    if (todayIndex === 0 || todayIndex === 6) return 'Lunes';
    return days[todayIndex];
  };

  const activeDay = getDayName();

  // Get what's programmed for today in child's lunchbox
  const getTodayProgrammedItems = (child: Child) => {
    return child.selectedLunchbox[activeDay] || [];
  };

  // Calculate standard lunchbox cost for today
  const getTodayCost = (child: Child) => {
    const items = getTodayProgrammedItems(child);
    return items.reduce((sum, currentId) => {
      const food = COLOMBIAN_FOOD_ITEMS.find(f => f.id === currentId);
      return sum + (food ? food.price : 0);
    }, 0);
  };

  // Tray management for extra items
  const handleAddExtraToTray = (food: FoodItem) => {
    if (!scannedChildObj) return;

    // Check 1: Allergy block
    const isAllergic = food.allergens.some(a => scannedChildObj.allergens.includes(a));
    if (isAllergic) {
      alert(`❌ BLOQUEADO: ${scannedChildObj.name} es alérgico a los componentes de ${food.name} (${food.allergens.join(', ')}).`);
      return;
    }

    // Check 2: Ley 2120 warning seal block if parents configured it
    // Let's assume parents set restricted categories on high sugar/trans fats
    const chatarraRestrict = scannedChildObj.restrictedCategories.includes('snack-chatarra') && !food.isHealthy;
    const sugarRestrict = scannedChildObj.restrictedCategories.includes('alto-en-azucar') && food.seals.includes('azucar');
    
    if (chatarraRestrict || sugarRestrict) {
      alert(`⚠️ BLOQUEADO POR ACUDIENTE: Los padres de ${scannedChildObj.name} restringieron la compra de productos etiquetados o procesados.`);
      return;
    }

    // Check 3: Spend Limit exceed
    const currentTodaySpent = getTodayCost(scannedChildObj);
    const trayCost = canteenTray.reduce((acc, currId) => {
      const item = COLOMBIAN_FOOD_ITEMS.find(f => f.id === currId);
      return acc + (item ? item.price : 0);
    }, 0);

    const prospectiveTotal = currentTodaySpent + trayCost + food.price;
    if (prospectiveTotal > scannedChildObj.dailySpendLimit) {
      alert(`🛑 ERROR: Supera el límite diario de compra configurado por los padres ($${scannedChildObj.dailySpendLimit.toLocaleString('es-CO')} COP).`);
      return;
    }

    // Pass all checks: add item to tray
    setCanteenTray([...canteenTray, food.id]);
  };

  const handleRemoveExtraFromTray = (foodId: string) => {
    const index = canteenTray.indexOf(foodId);
    if (index > -1) {
      const updated = [...canteenTray];
      updated.splice(index, 1);
      setCanteenTray(updated);
    }
  };

  // Complete and verify delivery
  const handleApproveDelivery = () => {
    if (!scannedChildObj) return;

    const programmedItems = getTodayProgrammedItems(scannedChildObj);
    const programmedCost = getTodayCost(scannedChildObj);

    // Extras cost calculation
    const extrasCost = canteenTray.reduce((acc, currId) => {
      const item = COLOMBIAN_FOOD_ITEMS.find(f => f.id === currId);
      return acc + (item ? item.price : 0);
    }, 0);

    const totalTransactionCost = programmedCost + extrasCost;

    // Verify child has enough balance
    if (scannedChildObj.balance < totalTransactionCost) {
      setErrorMessage(`Saldo insuficiente. Se requieren $${totalTransactionCost.toLocaleString('es-CO')} COP. Saldo disponible: $${scannedChildObj.balance.toLocaleString('es-CO')} COP.`);
      setScanStep('error');
      return;
    }

    // Process payment and save state
    const updatedChildren = children.map(c => {
      if (c.id === scannedChildObj.id) {
        return {
          ...c,
          balance: c.balance - totalTransactionCost
        };
      }
      return c;
    });

    onUpdateChildren(updatedChildren);

    // List delivered items
    const allItemsDelivered: string[] = [];
    programmedItems.forEach(id => {
      const food = COLOMBIAN_FOOD_ITEMS.find(f => f.id === id);
      if (food) allItemsDelivered.push(food.name);
    });
    canteenTray.forEach(id => {
      const food = COLOMBIAN_FOOD_ITEMS.find(f => f.id === id);
      if (food) allItemsDelivered.push(food.name + ' (Extra)');
    });

    // Create Transaction Record
    const newTx: Transaction = {
      id: 't_canteen_' + Date.now(),
      childId: scannedChildObj.id,
      childName: scannedChildObj.name,
      date: new Date().toISOString(),
      items: allItemsDelivered,
      total: totalTransactionCost,
      type: 'compra',
      status: 'completado'
    };

    onAddTransaction(newTx);
    setScanStep('success');

    // Simulate immediate Colombian SMS notification alert to parent:
    const foodListFormatted = allItemsDelivered.join(', ');
    const remainBalance = scannedChildObj.balance - totalTransactionCost;
    setSmsNotification(
      `🔔 SMS ACUDIENTE: ¡Entrega verificada! ${scannedChildObj.name} retiró: [${foodListFormatted}] por valor de $${totalTransactionCost.toLocaleString('es-CO')} COP. Saldo Caspete restante: $${remainBalance.toLocaleString('es-CO')} COP.`
    );
  };

  const handleResetScan = () => {
    onClearScannedChildId();
    setSelectedChildId(null);
    setScanStep('idle');
    setSmsNotification(null);
    setCanteenTray([]);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 animate-fade-in text-left">
      
      {/* Dashboard Canteen Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-[#98FF00] uppercase tracking-widest font-mono">Punto de Entrega (POS)</span>
          <h2 className="font-display text-3xl font-black text-white mt-1">Caspete Cafetería Escolar</h2>
        </div>
        
        {/* Day simulator indicators */}
        <div className="flex items-center gap-2 bg-[#111] px-4 py-2.5 rounded-xl border border-white/5 font-bold text-xs shadow-md text-zinc-300">
          <div className="w-2.5 h-2.5 rounded-full bg-[#98FF00] animate-pulse" />
          <span>Simulando Turno de Descanso: <strong className="text-white font-bold">{activeDay}</strong></span>
        </div>
      </div>

      {smsNotification && (
        /* SMS Parent Alert Mock Block */
        <div className="bg-[#1f092e] border-l-4 border-[#98FF00] p-4 rounded-r-2xl text-white text-sm mb-6 flex items-start gap-3 shadow-lg animate-bounce">
          <BellRing className="h-5 w-5 text-[#98FF00] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h5 className="font-bold text-xs text-[#98FF00] tracking-wide">Notificación Express de Trazabilidad Al Instante</h5>
            <p className="mt-0.5 text-xs opacity-95 text-zinc-200">{smsNotification}</p>
          </div>
          <button 
            onClick={() => setSmsNotification(null)}
            className="text-xs opacity-50 hover:opacity-100 font-bold cursor-pointer text-[#98FF00]"
          >
            ×
          </button>
        </div>
      )}

      {scanStep === 'idle' && (
        /* Canteen Scanner Landing View */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Block - The scanning laser graphic device (7 Columns) */}
          <div className="md:col-span-7 bg-[#111111] p-8 rounded-[2rem] border border-white/5 shadow-md flex flex-col justify-between space-y-8">
            <div className="space-y-4 text-center py-10">
              <div className="w-24 h-24 rounded-3xl bg-[#121c14] text-[#98FF00] flex items-center justify-center mx-auto border-2 border-dashed border-[#98FF00] p-3 shadow-xl qr-glow">
                <QrCode className="h-full w-full animate-pulse" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-extrabold text-white">Lector de Código QR Caspete</h3>
                <p className="text-zinc-400 text-sm max-w-sm mx-auto mt-2 leading-relaxed">Coloque carné del alumno, pulsera inteligente o celular frente al flash de la terminal para cargar y autorizar su lonchera programada.</p>
              </div>
            </div>

            {/* Simulated Scanner manual selectors */}
            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 space-y-4">
              <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider text-center font-mono">Simulador de lectura QR de estudiantes:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {children.map(kid => (
                  <button
                    key={kid.id}
                    onClick={() => handleSimulateScan(kid.id)}
                    className="flex items-center justify-between p-3 bg-[#111111] hover:bg-[#18181b] border border-white/5 hover:border-[#98FF00]/40 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <img src={kid.photo} alt={kid.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                      <div>
                        <span className="font-bold text-xs text-zinc-200 block group-hover:text-white">{kid.name}</span>
                        <span className="text-[10px] text-zinc-500">{kid.grade}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-black bg-[#98FF00] px-2.5 py-1.5 rounded-lg transition-all font-mono">
                      LEER QR
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Block - Sales statistics and live menu (5 Columns) */}
          <div className="md:col-span-5 bg-[#111111] p-8 rounded-[2rem] border border-white/5 shadow-md flex flex-col justify-between space-y-8 text-left">
            <div className="space-y-6">
              <h4 className="font-display text-lg font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
                <Utensils className="h-5 w-5 text-[#98FF00]" />
                <span>Ecosistema de Menú Saludable</span>
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Bajo la ley de comida saludable del Ministerio de Salud colombiano, promovemos preparaciones naturales, arepas de maíz, porciones de frutas picadas y jugos artesanales. Los alumnos retiran su lonchera sin portar dinero de papel.
              </p>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3.5 bg-[#070709] rounded-xl border border-white/5 text-xs">
                  <span className="font-semibold text-zinc-300">Alergias Detectadas (Filtro QR)</span>
                  <span className="text-rose-400 bg-rose-950/40 border border-rose-900/30 px-2.5 py-0.5 rounded-lg font-bold text-[10px] uppercase font-mono tracking-wide">Protección Activa</span>
                </div>
                <div className="flex justify-between items-center p-3.5 bg-[#070709] rounded-xl border border-white/5 text-xs">
                  <span className="font-semibold text-zinc-300">Tiempos de Atención Estimados</span>
                  <span className="text-[#98FF00] bg-[#121c14] border border-[#98FF00]/10 px-2.5 py-0.5 rounded-lg font-bold text-[10px] uppercase font-mono tracking-wide">&lt; 3.5 Segundos</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 text-zinc-500 text-[10px] leading-relaxed">
              Cumplimiento a cabalidad de directivas de entornos escolares saludables de la Ley 2120 de la República de Colombia.
            </div>
          </div>

        </div>
      )}

      {scanStep === 'scanning' && (
        /* Middle scanning delay view simulation */
        <div className="bg-[#111111] rounded-[2rem] p-12 text-center border border-white/10 ring-4 ring-[#98FF00]/5 max-w-lg mx-auto my-12 space-y-6">
          <div className="relative inline-block py-4">
            <div className="w-20 h-20 rounded-full border-4 border-zinc-800 border-t-[#98FF00] animate-spin" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-xs font-black text-[#98FF00] animate-pulse">
              LASER
            </div>
          </div>
          <div>
            <h4 className="font-display font-bold text-white">Leyendo Código de Seguridad...</h4>
            <p className="text-zinc-400 text-xs mt-1">Conectando con base de datos escolar cifrada. Cargando restricciones del acudiente.</p>
          </div>
        </div>
      )}

      {scanStep === 'details' && scannedChildObj && (
        /* Comprehensive Scanned Student Profile and Verification */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in text-left">
          
          {/* Scanned Student Information (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Main Badge Card */}
            <div className="bg-[#111111] rounded-[2rem] p-6 border border-white/5 shadow-md space-y-5">
              <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                <img src={scannedChildObj.photo} alt={scannedChildObj.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-[#98FF00]" />
                <div>
                  <span className="text-[9px] font-bold text-[#98FF00] uppercase tracking-widest font-mono">Verificado</span>
                  <h3 className="font-display text-xl font-black text-white leading-tight">{scannedChildObj.name}</h3>
                  <p className="text-xs text-zinc-400 font-semibold">{scannedChildObj.grade}</p>
                </div>
              </div>

              {/* Balances detailed comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#070709] rounded-2xl border border-white/5 text-left">
                  <span className="text-[10px] text-zinc-500 font-bold block font-mono">SALDO DISPONIBLE</span>
                  <span className="font-display text-lg font-black text-[#98FF00] font-mono">${scannedChildObj.balance.toLocaleString('es-CO')}</span>
                </div>
                <div className="p-3 bg-[#070709] rounded-2xl border border-white/5 text-left">
                  <span className="text-[10px] text-zinc-500 font-bold block font-mono">LÍMITE DIARIO</span>
                  <span className="font-display text-lg font-black text-zinc-300 font-mono">${scannedChildObj.dailySpendLimit.toLocaleString('es-CO')}</span>
                </div>
              </div>

              {/* Allergy BIG triggers */}
              {scannedChildObj.allergens.length > 0 && (
                <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-2xl">
                  <div className="flex gap-2.5 items-start">
                    <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-black text-rose-400 uppercase tracking-widest font-mono">¡RESTRICCIÓN ALÉRGICA DE PADRES!</h5>
                      <p className="text-[11px] text-rose-300 font-normal mt-1 leading-relaxed">El alumno registra alergia a: <strong>{scannedChildObj.allergens.join(', ').toUpperCase()}</strong>. Queda Prohibido vender ingredientes implicados.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Canteen Extras Selector Panel */}
            <div className="bg-[#111111] rounded-[2rem] p-6 border border-white/5 shadow-md space-y-4">
              <div className="border-b border-white/5 pb-2">
                <h4 className="font-display font-bold text-white">Menú Adicional Discrecional</h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">La compra de estos artículos evaluará en tiempo real el límite diario y restricciones configurados por el acudiente.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {COLOMBIAN_FOOD_ITEMS.map(food => (
                  <button
                    key={food.id}
                    onClick={() => handleAddExtraToTray(food)}
                    className="p-2.5 rounded-xl border bg-[#070709] border-white/5 hover:border-[#98FF00]/40 text-left flex items-center justify-between transition-all cursor-pointer text-xs group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{food.image}</span>
                      <div>
                        <span className="font-bold text-zinc-200 block group-hover:text-white leading-none">{food.name.split(' ')[0]}</span>
                        <span className="text-[9px] text-zinc-500 font-mono mt-0.5 block">${food.price.toLocaleString('es-CO')}</span>
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-zinc-350 bg-zinc-800 p-0.5 border border-white/5 rounded-md" />
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Tray verification and confirm deliveries (7 Columns) */}
          <div className="lg:col-span-7 bg-[#111111] p-6 rounded-[2rem] border border-white/5 shadow-md flex flex-col justify-between space-y-6">
            
            <div className="space-y-6">
              
              {/* Daily pre-programmed items list */}
              <div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono block mb-3">Lonchera Programada por Padres (Hoy {activeDay})</span>
                {getTodayProgrammedItems(scannedChildObj).length > 0 ? (
                  <div className="space-y-2">
                    {getTodayProgrammedItems(scannedChildObj).map(itemId => {
                      const item = COLOMBIAN_FOOD_ITEMS.find(f => f.id === itemId);
                      if (!item) return null;
                      return (
                        <div key={itemId} className="flex justify-between items-center p-3.5 bg-[#121c14] border border-[#98FF00]/10 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <span className="text-xl p-1.5 bg-black rounded-xl border border-white/5">{item.image}</span>
                            <div>
                              <span className="font-bold text-zinc-100 text-sm block">{item.name}</span>
                              <span className="text-[10px] text-[#98FF00] font-black uppercase font-mono tracking-wide">{item.category} saludable</span>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold text-[#98FF00]">${item.price.toLocaleString('es-CO')}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-amber-950/20 text-amber-300 p-4 border border-dashed border-amber-900/30 rounded-2xl text-xs text-center font-bold">
                    El acudiente no programó lonchera para hoy. Proceda a vender del menú discrecional si se posee saldo suficiente.
                  </div>
                )}
              </div>

              {/* Extras selected Tray list */}
              {canteenTray.length > 0 && (
                <div className="animate-fade-in">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono block mb-3">Bandeja de Consumo Adicional</span>
                  <div className="space-y-2">
                    {canteenTray.map((extraId, idx) => {
                      const item = COLOMBIAN_FOOD_ITEMS.find(f => f.id === extraId);
                      if (!item) return null;
                      return (
                        <div key={idx} className="flex justify-between items-center p-3 bg-[#070709] border border-white/5 rounded-2xl text-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-xl p-1.5 bg-black rounded-xl border border-white/10">{item.image}</span>
                            <div>
                              <span className="font-bold text-zinc-200 block">{item.name}</span>
                              <span className="text-xs text-zinc-400 font-semibold">{item.isHealthy ? 'Menú Libre' : 'Snack Convencional'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-zinc-350">${item.price.toLocaleString('es-CO')}</span>
                            <button
                              onClick={() => handleRemoveExtraFromTray(extraId)}
                              className="text-zinc-650 hover:text-rose-450 p-1 cursor-pointer"
                              title="Retirar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Calculation Summary block */}
              <div className="pt-4 border-t border-white/5 space-y-2">
                <div className="flex justify-between items-center text-xs text-zinc-450">
                  <span>Costo Lonchera Programada:</span>
                  <span className="font-bold font-mono text-zinc-300">${getTodayCost(scannedChildObj).toLocaleString('es-CO')} COP</span>
                </div>
                {canteenTray.length > 0 && (
                  <div className="flex justify-between items-center text-xs text-[#98FF00]/95">
                    <span>Adicionales bandeja:</span>
                    <span className="font-bold font-mono">
                      +${canteenTray.reduce((sum, id) => sum + (COLOMBIAN_FOOD_ITEMS.find(f => f.id === id)?.price || 0), 0).toLocaleString('es-CO')} COP
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-base font-extrabold text-white border-t border-white/5 pt-3">
                  <span>Total Cobro Digital QR:</span>
                  <span className="font-mono text-[#98FF00] font-black text-xl">
                    ${(getTodayCost(scannedChildObj) + canteenTray.reduce((sum, id) => sum + (COLOMBIAN_FOOD_ITEMS.find(f => f.id === id)?.price || 0), 0)).toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>

            </div>

            {/* Action Triggers for completing delivery */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button
                onClick={handleResetScan}
                className="px-6 py-3.5 rounded-xl border border-white/10 text-zinc-400 hover:bg-zinc-800 font-semibold text-center text-sm cursor-pointer flex-1"
              >
                Volver al Lector
              </button>
              <button
                onClick={handleApproveDelivery}
                className="px-8 py-3.5 bg-[#98FF00] hover:bg-[#aefc2c] text-black font-display font-extrabold rounded-xl text-center flex items-center justify-center gap-2 flex-2 shadow-lg shadow-[#98FF00]/10 transition-all cursor-pointer"
              >
                <Check className="h-5 w-5 stroke-[2px]" />
                <span>Confirmar Entrega y Cobrar</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {scanStep === 'success' && scannedChildObj && (
        /* Scanning Delivery Success feedbacks state */
        <div className="bg-[#111111] rounded-[2rem] p-10 text-center border-2 border-[#98FF00]/40 max-w-lg mx-auto my-12 space-y-6 shadow-2xl animate-fade-in text-left">
          <div className="w-16 h-16 bg-[#121c14] text-[#98FF00] rounded-full flex items-center justify-center mx-auto border border-[#98FF00]/20">
            <Check className="h-8 w-8 stroke-[3px]" />
          </div>
          <div className="text-center space-y-2">
            <h4 className="font-display font-black text-white text-2xl">¡Ding! Entrega Verificada</h4>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-sm mx-auto">
              El pago escolar digital ha sido descontado con éxito. El acudiente ha recibido la confirmación de trazabilidad por SMS en tiempo real.
            </p>
          </div>

          <div className="bg-[#070709] p-4 border border-white/5 rounded-2xl text-xs space-y-1.5 text-left">
            <div className="flex justify-between text-zinc-450">
              <span>Estudiante:</span>
              <strong className="text-white font-bold">{scannedChildObj.name}</strong>
            </div>
            <div className="flex justify-between text-zinc-450">
              <span>Grado:</span>
              <strong className="text-white font-semibold">{scannedChildObj.grade}</strong>
            </div>
            <div className="flex justify-between text-zinc-450">
              <span>Saldo Restante:</span>
              <strong className="text-[#98FF00] font-mono">
                ${children.find(c => c.id === scannedChildObj.id)?.balance?.toLocaleString('es-CO')}
              </strong>
            </div>
          </div>

          <button
            onClick={handleResetScan}
            className="w-full py-4 bg-white text-black hover:bg-[#98FF00] hover:text-black font-display font-black rounded-xl text-center cursor-pointer transition-all"
          >
            Siguiente Alumno (Lector Activo)
          </button>
        </div>
      )}

      {scanStep === 'error' && (
        /* Failures / Limit blocked review state */
        <div className="bg-[#111111] rounded-[2rem] p-10 text-center border-2 border-rose-800/40 max-w-lg mx-auto my-12 space-y-6 shadow-2xl animate-fade-in text-left">
          <div className="w-16 h-16 bg-rose-950/20 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-900/35">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="text-center space-y-2">
            <h4 className="font-display font-black text-white text-2xl">Transacción Rechazada</h4>
            <p className="text-rose-400 text-sm font-semibold max-w-sm mx-auto leading-relaxed">
              {errorMessage}
            </p>
          </div>

          <p className="text-xs text-zinc-500 text-center leading-relaxed">
            Pídale al estudiante solicitar al acudiente realizar una recarga express desde su celular con Nequi o aumentar el límite diario de compra.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => {
                // Quick simulated Nequi recharge option to resolve problem instantly!
                const updatedChildren = children.map(c => {
                  if (c.id === scannedChildObj?.id) {
                    return { ...c, balance: c.balance + 30000 };
                  }
                  return c;
                });
                onUpdateChildren(updatedChildren);
                setScanStep('details');
              }}
              className="py-3 bg-semibold bg-[#121c14] border border-[#98FF00]/10 text-[#98FF00] text-xs font-bold rounded-xl cursor-pointer flex-1 text-center hover:bg-emerald-950/20"
            >
              Carga de Asistencia ($30M)
            </button>
            <button
              onClick={handleResetScan}
              className="py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl cursor-pointer flex-1"
            >
              Regresar al Lector
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
