import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Wallet, 
  Settings, 
  QrCode, 
  ArrowRight, 
  Check, 
  AlertTriangle,
  Sparkles,
  UserPlus,
  ArrowBigUp,
  History,
  Info,
  DollarSign
} from 'lucide-react';
import { Child, FoodItem, Transaction } from '../types';
import { COLOMBIAN_FOOD_ITEMS } from '../data/mockData';

interface ParentDashboardProps {
  children: Child[];
  onUpdateChildren: (children: Child[]) => void;
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  onSelectCanteenChild: (childId: string) => void;
}

export default function ParentDashboard({ 
  children, 
  onUpdateChildren, 
  transactions, 
  onAddTransaction,
  onSelectCanteenChild
}: ParentDashboardProps) {
  
  // Selection of active child to view/manage
  const [activeChildId, setActiveChildId] = useState<string>(children[0]?.id || '');
  const activeChild = children.find(c => c.id === activeChildId) || children[0];

  // Nequi pop up modal
  const [showNequiModal, setShowNequiModal] = useState(false);
  const [nequiPhone, setNequiPhone] = useState('3114567890');
  const [rechargeAmt, setRechargeAmt] = useState<number>(20000);
  const [isRecharging, setIsRecharging] = useState(false);
  const [rechargeStep, setRechargeStep] = useState<'form' | 'loading' | 'success'>('form');

  // New child register form
  const [showNewChildForm, setShowNewChildForm] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildGrade, setNewChildGrade] = useState('3° de Primaria');
  const [newChildAllergens, setNewChildAllergens] = useState<string[]>([]);
  const [tempAllergen, setTempAllergen] = useState('');

  // Day editor modal for lunchbox programming
  const [editingDay, setEditingDay] = useState<string | null>(null);

  // Filter transactions for currently selected child
  const childTransactions = transactions.filter(t => t.childId === activeChildId);

  // Add kid handler
  const handleCreateChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) return;

    const newKid: Child = {
      id: 'c_' + Date.now(),
      name: newChildName,
      grade: newChildGrade,
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', // standard portrait
      balance: 10000, // starts with $10.000 COP
      dailySpendLimit: 8000,
      allergens: newChildAllergens,
      restrictedCategories: [],
      selectedLunchbox: {
        'Lunes': ['f1', 'f8'],
        'Martes': ['f7', 'f3'],
        'Miércoles': ['f1', 'f8'],
        'Jueves': ['f7', 'f3'],
        'Viernes': ['f1', 'f8']
      }
    };

    onUpdateChildren([...children, newKid]);
    setActiveChildId(newKid.id);
    setNewChildName('');
    setNewChildAllergens([]);
    setShowNewChildForm(false);
  };

  const handleAddAllergen = () => {
    if (tempAllergen.trim() && !newChildAllergens.includes(tempAllergen.trim().toLowerCase())) {
      setNewChildAllergens([...newChildAllergens, tempAllergen.trim().toLowerCase()]);
      setTempAllergen('');
    }
  };

  const handleRemoveAllergen = (all: string) => {
    setNewChildAllergens(newChildAllergens.filter(a => a !== all));
  };

  // Nequi recharge simulation
  const handleNequiRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecharging(true);
    setRechargeStep('loading');

    // Simulate standard colombian Nequi gateway checking phone and OTP confirmation
    setTimeout(() => {
      // Complete recharge
      const updatedChildren = children.map(c => {
        if (c.id === activeChildId) {
          return { ...c, balance: c.balance + rechargeAmt };
        }
        return c;
      });

      onUpdateChildren(updatedChildren);

      // Create a transaction record
      const newTx: Transaction = {
        id: 't_req_' + Date.now(),
        childId: activeChildId,
        childName: activeChild.name,
        date: new Date().toISOString(),
        items: [],
        total: rechargeAmt,
        type: 'recarga',
        status: 'completado'
      };

      onAddTransaction(newTx);
      setRechargeStep('success');
      setIsRecharging(false);
    }, 2000);
  };

  // Daily budget handler
  const handleUpdateLimit = (val: number) => {
    const updated = children.map(c => {
      if (c.id === activeChildId) {
        return { ...c, dailySpendLimit: val };
      }
      return c;
    });
    onUpdateChildren(updated);
  };

  // Allergy setting editor directly on child
  const handleToggleChildAllergen = (all: string) => {
    const alreadyHas = activeChild.allergens.includes(all);
    const updatedAllergens = alreadyHas 
      ? activeChild.allergens.filter(a => a !== all)
      : [...activeChild.allergens, all];

    const updated = children.map(c => {
      if (c.id === activeChildId) {
        return { ...c, allergens: updatedAllergens };
      }
      return c;
    });
    onUpdateChildren(updated);
  };

  // Add individual item to a day's lunchbox
  const handleAddFoodToLunchbox = (day: string, foodId: string) => {
    const currentDayItems = activeChild.selectedLunchbox[day] || [];
    if (currentDayItems.includes(foodId)) return; // already added

    const updated = children.map(c => {
      if (c.id === activeChildId) {
        const newLunchbox = { ...c.selectedLunchbox };
        newLunchbox[day] = [...currentDayItems, foodId];
        return { ...c, selectedLunchbox: newLunchbox };
      }
      return c;
    });
    onUpdateChildren(updated);
  };

  // Remove individual item from a day's lunchbox
  const handleRemoveFoodFromLunchbox = (day: string, foodId: string) => {
    const updated = children.map(c => {
      if (c.id === activeChildId) {
        const newLunchbox = { ...c.selectedLunchbox };
        newLunchbox[day] = (newLunchbox[day] || []).filter(item => item !== foodId);
        return { ...c, selectedLunchbox: newLunchbox };
      }
      return c;
    });
    onUpdateChildren(updated);
  };

  const getDayTotal = (dayItems: string[]) => {
    return dayItems.reduce((acc, currentId) => {
      const food = COLOMBIAN_FOOD_ITEMS.find(f => f.id === currentId);
      return acc + (food ? food.price : 0);
    }, 0);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 animate-fade-in text-left">
      
      {/* Dashboard Grid Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-[#98FF00] uppercase tracking-widest font-mono">Panel de Control</span>
          <h2 className="font-display text-3xl font-black text-white mt-1">Caspete Inteligente de Padres</h2>
        </div>
        
        {/* Child Select Switcher or Add Kid */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {children.map(kid => (
            <button
              key={kid.id}
              onClick={() => {
                setActiveChildId(kid.id);
                setShowNewChildForm(false);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                activeChildId === kid.id && !showNewChildForm
                  ? 'bg-[#121c14] border-[#98FF00]/40 text-[#98FF00] shadow-lg shadow-[#98FF00]/5'
                  : 'bg-[#111] border-white/5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <div className="w-5.5 h-5.5 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 border border-white/10">
                <img src={kid.photo} alt={kid.name} className="object-cover w-full h-full" />
              </div>
              <span>{kid.name.split(' ')[0]}</span>
            </button>
          ))}
          <button
            onClick={() => {
              setShowNewChildForm(true);
              setNewChildName('');
              setNewChildAllergens([]);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              showNewChildForm 
                ? 'bg-[#98FF00] border-[#98FF00] text-black font-bold'
                : 'bg-[#111] text-zinc-300 border-white/5 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>Nuevo Hijo</span>
          </button>
        </div>
      </div>

      {showNewChildForm ? (
        /* Form state for creating a new kid profile */
        <div className="bg-[#111111] rounded-[2rem] p-8 border border-white/10 shadow-xl max-w-2xl mx-auto mb-12 animate-fade-in">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-display text-2xl font-bold text-white">Registrar Nuevo Estudiante</h3>
              <p className="text-zinc-400 text-sm mt-1">Crea la ficha escolar de tu hijo para habilitar el portal saludable y QR.</p>
            </div>
            <button 
              onClick={() => setShowNewChildForm(false)}
              className="p-1 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleCreateChild} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Nombre Completo:</label>
              <input
                type="text"
                placeholder="Ej. Juan Carlos González"
                value={newChildName}
                onChange={e => setNewChildName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#070709] border border-white/5 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#98FF00]/40 text-white leading-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Grado Escolar:</label>
                <select
                  value={newChildGrade}
                  onChange={e => setNewChildGrade(e.target.value)}
                  className="w-full px-4 py-3 bg-[#070709] border border-white/5 rounded-xl focus:outline-hidden text-zinc-300"
                >
                  <option value="Jardín Infantil">Jardín Infantil</option>
                  <option value="Transición B">Transición B</option>
                  <option value="1° de Primaria">1° de Primaria</option>
                  <option value="2° de Primaria">2° de Primaria</option>
                  <option value="3° de Primaria">3° de Primaria</option>
                  <option value="4° de Primaria">4° de Primaria</option>
                  <option value="5° de Primaria">5° de Primaria</option>
                  <option value="6° de Bachillerato">6° de Bachillerato</option>
                  <option value="11° de Bachillerato">11° de Bachillerato</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Saldo de Lanzamiento:</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    disabled
                    value="10000"
                    className="w-full pl-6 pr-4 py-3 bg-zinc-900 border border-white/5 rounded-xl text-zinc-400 font-mono text-sm select-none font-bold"
                  />
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">Inicia con crédito base de $10.000 COP</span>
              </div>
            </div>

            {/* Allergens form list */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Alergias Alimentarias:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. Lácteos, Huevos, Maní, Nueces..."
                  value={tempAllergen}
                  onChange={e => setTempAllergen(e.target.value)}
                  className="flex-1 px-4 py-3 bg-[#070709] border border-white/5 rounded-xl focus:outline-hidden text-white"
                />
                <button
                  type="button"
                  onClick={handleAddAllergen}
                  className="px-5 bg-zinc-800 text-white rounded-xl text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                >
                  Añadir
                </button>
              </div>
              
              {newChildAllergens.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {newChildAllergens.map(all => (
                    <span key={all} className="bg-rose-950/40 text-rose-450 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 border border-rose-900/30">
                      <span className="capitalize">{all}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveAllergen(all)}
                        className="text-rose-500 font-black hover:text-rose-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 text-black font-display font-extrabold text-base rounded-xl bg-[#98FF00] hover:bg-[#a5ff1d] transition-all cursor-pointer"
            >
              Confirmar Registro e Iniciar Plan
            </button>
          </form>
        </div>
      ) : (
        /* Selected active child management dashboard */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left profile overview & finance wallet context (4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Child Profile Card */}
            <div className="bg-[#111111] rounded-[2rem] p-6 border border-white/5 shadow-md text-center space-y-4">
              <div className="relative mx-auto w-24 h-24 rounded-full overflow-hidden border-4 border-[#98FF00]/20 shadow-lg">
                <img src={activeChild?.photo} alt={activeChild?.name} className="object-cover w-full h-full" />
              </div>
              <div>
                <h3 className="font-display text-xl font-extrabold text-white leading-tight">{activeChild?.name}</h3>
                <span className="text-xs text-zinc-400 font-semibold bg-zinc-900 border border-white/5 px-3 py-1 rounded-full mt-1.5 inline-block">
                  {activeChild?.grade}
                </span>
              </div>

              {/* Balance Widget with Nequi charging option */}
              <div className="bg-[#121c14] rounded-2xl p-4 border border-[#98FF00]/10 flex justify-between items-center text-left">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-mono">Saldo Escolar Digital</span>
                  <span className="font-display text-2xl font-black text-[#98FF00] font-mono">
                    ${activeChild?.balance?.toLocaleString('es-CO')}
                  </span>
                  <span className="text-[9px] text-emerald-500 block leading-none mt-1">Sincronizado al carné QR</span>
                </div>
                <button
                  onClick={() => {
                    setRechargeStep('form');
                    setShowNequiModal(true);
                  }}
                  className="nequi-gradient text-white font-display text-xs font-bold px-4 py-2.5 rounded-xl shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Wallet className="h-4 w-4 text-brand-yellow-400" />
                  <span>Carga Nequi</span>
                </button>
              </div>

              {/* Test link directly to verify QR in school cafeteria scanner */}
              <button
                onClick={() => onSelectCanteenChild(activeChildId)}
                className="w-full border border-dashed border-white/10 hover:border-[#98FF00]/30 hover:bg-[#98FF00]/5 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-zinc-400 hover:text-[#98FF00] transition-all cursor-pointer"
              >
                <QrCode className="h-4 w-4" />
                <span>Simular Escaneo en Cafetería</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Daily limit setting & health alerts config */}
            <div className="bg-[#111111] rounded-[2rem] p-6 border border-white/5 shadow-md space-y-5">
              <h4 className="font-display text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <Settings className="h-5 w-5 text-zinc-500" />
                <span>Límites y Restricciones</span>
              </h4>

              {/* Limit Slider */}
              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-zinc-500 uppercase tracking-widest font-mono">Límite Diario COP</span>
                  <span className="text-[#98FF00] bg-[#121c14] px-2 py-0.5 rounded-md font-mono border border-[#98FF00]/10">${activeChild?.dailySpendLimit?.toLocaleString('es-CO')}</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="20000"
                  step="1000"
                  value={activeChild?.dailySpendLimit}
                  onChange={(e) => handleUpdateLimit(Number(e.target.value))}
                  className="w-full accent-[#98FF00] bg-zinc-900 rounded-lg cursor-ew-resize h-1.5 mt-2"
                />
                <span className="text-[9px] text-zinc-500 block mt-1">Impide retiros extraordinarios por encima de este valor diario.</span>
              </div>

              {/* Allergy Quick Toggles */}
              <div className="space-y-3 pt-3 border-t border-white/5 text-left">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block font-mono">Alergias Alimentarias (Gatilla alerta):</span>
                
                <div className="space-y-2">
                  {['lácteos', 'huevo', 'gluten', 'maní'].map(all => {
                    const active = activeChild?.allergens?.includes(all);
                    return (
                      <button
                        key={all}
                        onClick={() => handleToggleChildAllergen(all)}
                        className={`w-full flex justify-between items-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          active
                            ? 'bg-rose-950/20 border-rose-900/40 text-rose-400'
                            : 'bg-[#070709] border-white/5 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        <span className="capitalize">{all}</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          active ? 'bg-rose-500 border-rose-500 text-white' : 'border-zinc-700 bg-black'
                        }`}>
                          {active && <Check className="h-3 w-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* QR Code Active Token Display */}
            <div className="bg-[#111111] rounded-[2rem] p-6 border border-white/5 shadow-md flex flex-col items-center justify-center space-y-3 text-center">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Carné Escolar QR Activo</span>
              <div className="p-3 border-2 border-dashed border-[#98FF00]/25 bg-[#070709] rounded-2xl relative qr-glow-static">
                <QrCode className="h-32 w-32 text-white" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black p-1.5 rounded-lg border border-white/10 text-base">
                  <span>👶</span>
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-300">Token ID: #CAS-{activeChild?.id?.toUpperCase()}</span>
                <p className="text-[10px] text-zinc-500 max-w-xs leading-normal mt-1.5">Este código dinámico se puede imprimir o cargar en el celular. Garantiza recolección verídica de lonchera sin dinero físico.</p>
              </div>
            </div>

          </div>

          {/* Right weekly planning and transaction history workspace (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Weekly Lunchbox Planner View */}
            <div className="bg-[#111111] rounded-[2rem] p-6 border border-white/5 shadow-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-white/5">
                <div>
                  <h3 className="font-display text-xl font-bold text-white">Programación Semanal de Loncheras</h3>
                  <p className="text-zinc-400 text-xs mt-0.5">Controla la nutrición semanal y evita compras impulsivas no aprobadas.</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold bg-[#121c14] border border-[#98FF00]/10 px-3 py-1.5 text-[#98FF00] rounded-lg">
                  <Info className="h-4 w-4" />
                  <span>Ley 2120 de Salud Asegurada</span>
                </div>
              </div>

              {/* 5-day Columns Block */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(day => {
                  const dayFoodIds = activeChild?.selectedLunchbox[day] || [];
                  const dayTotal = getDayTotal(dayFoodIds);

                  return (
                    <div key={day} className="bg-[#070709] rounded-2xl p-3 border border-white/5 flex flex-col justify-between min-h-[220px]">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-extrabold text-zinc-300">{day}</span>
                          <span className="text-[10px] font-bold text-[#98FF00] font-mono">${dayTotal?.toLocaleString('es-CO')}</span>
                        </div>

                        {/* Items listed in active day lunchbox */}
                        <div className="space-y-1.5">
                          {dayFoodIds.length > 0 ? (
                            dayFoodIds.map(fId => {
                              const food = COLOMBIAN_FOOD_ITEMS.find(f => f.id === fId);
                              if (!food) return null;
                              return (
                                <div key={fId} className="flex justify-between items-center bg-[#111111] p-1.5 rounded-xl border border-white/5 group">
                                  <div className="flex items-center gap-1 overflow-hidden">
                                    <span className="text-[14px] flex-shrink-0">{food.image}</span>
                                    <span className="text-[9px] font-semibold text-zinc-300 truncate" title={food.name}>
                                      {food.name.split(' ')[0]}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveFoodFromLunchbox(day, fId)}
                                    className="text-zinc-600 hover:text-rose-450 p-0.5 cursor-pointer"
                                    title="Quitar"
                                  >
                                    <Trash2 className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-[9px] text-zinc-600 text-center py-5 border border-dashed rounded-xl border-zinc-800">
                              Vacía
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Edit Button for standard list selection */}
                      <button
                        onClick={() => setEditingDay(day)}
                        className="w-full mt-3 py-1.5 bg-[#18181b] border border-white/5 hover:border-[#98FF00]/30 hover:text-[#98FF00] text-zinc-400 text-[10px] font-extrabold rounded-xl transition-all cursor-pointer"
                      >
                        + Programar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Editing Day modal list panel directly embedded to keep context alive */}
            {editingDay && (
              <div className="bg-[#121c14]/45 rounded-[2rem] p-6 border border-[#98FF00]/20 animate-slide-up text-left">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-display font-bold text-white">Estás añadiendo alimentos para el día <span className="text-[#98FF00] font-black">{editingDay}</span></h4>
                    <p className="text-zinc-400 text-xs mt-0.5">Haz clic sobre los productos sanos para incluirlos en la lonchera.</p>
                  </div>
                  <button 
                    onClick={() => setEditingDay(null)}
                    className="p-1 px-4 bg-[#111] border border-white/10 hover:bg-[#18181b] text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {COLOMBIAN_FOOD_ITEMS.map(food => {
                    const isSelected = activeChild?.selectedLunchbox[editingDay]?.includes(food.id);
                    // Check allergy safety alert
                    const allergenAlert = food.allergens.some(a => activeChild?.allergens?.includes(a));

                    return (
                      <button
                        key={food.id}
                        onClick={() => {
                          if (isSelected) {
                            handleRemoveFoodFromLunchbox(editingDay, food.id);
                          } else {
                            handleAddFoodToLunchbox(editingDay, food.id);
                          }
                        }}
                        className={`p-3 rounded-xl border transition-all text-left flex items-start gap-3 justify-between group cursor-pointer ${
                          isSelected
                            ? 'border-[#98FF00]/40 bg-[#152713]'
                            : allergenAlert
                              ? 'border-rose-950/50 bg-rose-950/15 hover:bg-rose-950/20'
                              : 'bg-[#111111] border-white/5 hover:border-zinc-800'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xl p-1 bg-black rounded-lg border border-white/5">{food.image}</span>
                          <div>
                            <span className="font-bold text-zinc-200 text-xs block group-hover:text-white">{food.name}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">${food.price.toLocaleString('es-CO')}</span>
                            
                            {/* Allergen labels */}
                            {allergenAlert && (
                              <span className="text-[8px] bg-rose-950/80 text-rose-400 border border-rose-900/50 px-2 py-0.5 rounded-sm font-semibold inline-block mt-1 uppercase tracking-wide">
                                ⚠️ ALERGIA: {food.allergens.join('/')}
                              </span>
                            )}
                            
                            {/* Colombia warn seals octagons in miniature */}
                            {food.seals.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {food.seals.map(s => (
                                  <span key={s} className="bg-black border border-zinc-800 text-[#98FF00] font-black text-[7px] px-1 rounded-sm tracking-widest uppercase font-mono">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'bg-[#98FF00] border-[#98FF00] text-black' : 'border-zinc-700 bg-black'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 stroke-[3px]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Consumption History Log List with status filtering */}
            <div className="bg-[#111111] rounded-[2rem] p-6 border border-white/5 shadow-md">
              <h3 className="font-display text-lg font-bold text-white mb-4 pb-2 border-b border-white/5 flex items-center gap-2">
                <History className="h-5 w-5 text-zinc-500" />
                <span>Historial de Movimientos Recientes</span>
              </h3>

              {childTransactions.length > 0 ? (
                <div className="space-y-3">
                  {childTransactions.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center p-3 rounded-xl bg-[#070709] border border-white/5 hover:border-white/10 transition-all text-sm">
                      <div className="flex items-center gap-3 text-left">
                        <div className={`p-2.5 rounded-xl ${
                          tx.type === 'recarga' ? 'bg-emerald-950/40 text-[#98FF00]' : 'bg-zinc-900 text-purple-400'
                        }`}>
                          {tx.type === 'recarga' ? <ArrowBigUp className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-200">
                            {tx.type === 'recarga' ? 'Recarga Express Nequi' : 'Consumo en Cafetería'}
                          </div>
                          <span className="text-[10px] text-zinc-500 block leading-none mt-1">
                            {new Date(tx.date).toLocaleDateString('es-CO')} · {new Date(tx.date).toLocaleTimeString('es-CO', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          {tx.items.length > 0 && (
                            <span className="text-[10px] text-zinc-400 font-semibold block mt-1.5">
                              Retiró: {tx.items.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-display font-extrabold font-mono text-sm leading-none ${
                          tx.type === 'recarga' ? 'text-emerald-400Color font-bold text-[#98FF00]' : 'text-[#f1f1f1]'
                        }`}>
                          {tx.type === 'recarga' ? '+' : '-'}${tx.total.toLocaleString('es-CO')}
                        </span>
                        <div className="text-[9px] text-zinc-500 italic block mt-1.5">Transacción Certificada</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-[#070709] border border-dashed rounded-xl border-white/5 text-zinc-500 text-xs">
                  Aún no se registran movimientos para este alumno. ¡Realiza una recarga Nequi para simular!
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Nequi payment authorization simulated modal overlay */}
      {showNequiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#111111] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl w-full max-w-sm animate-slide-up text-left">
            
            {/* Nequi Header Branding */}
            <div className="nequi-gradient text-white p-6 flex justify-between items-center relative">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-yellow-400 animate-pulse flex items-center justify-center">
                  <span className="text-slate-950 font-black text-xs font-mono">N</span>
                </div>
                <div>
                  <h4 className="font-display font-black text-sm tracking-widest uppercase">Portal Nequi</h4>
                  <p className="text-[8px] opacity-75 leading-none">PAGO EXPRESS CASPETE</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNequiModal(false)}
                className="text-white hover:text-brand-yellow-400 font-bold text-xs focus:outline-hidden cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {rechargeStep === 'form' && (
              <form onSubmit={handleNequiRecharge} className="p-6 space-y-6">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold block mb-1 uppercase tracking-wider">Hijo a Recargar:</span>
                  <div className="flex items-center gap-2 bg-[#070709] p-2.5 rounded-xl border border-white/5">
                    <img src={activeChild?.photo} alt={activeChild?.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                    <div>
                      <span className="font-bold text-xs text-white block">{activeChild?.name}</span>
                      <span className="text-[10px] text-zinc-400">Saldo actual: ${activeChild?.balance?.toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 font-mono">Celular de Origen Nequi:</label>
                  <input
                    type="tel"
                    value={nequiPhone}
                    onChange={e => setNequiPhone(e.target.value)}
                    required
                    placeholder="312 456 7890"
                    pattern="[0-9]{10}"
                    className="w-full px-4 py-3 bg-[#070709] border border-white/5 rounded-xl font-mono text-sm tracking-widest focus:outline-hidden text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 font-mono">Monto a Recargar (COP):</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[10000, 20000, 50000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setRechargeAmt(amt)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          rechargeAmt === amt
                            ? 'bg-[#98FF00] border-[#98FF00] text-black font-extrabold'
                            : 'bg-[#070709] border-white/5 hover:border-zinc-800 text-zinc-350'
                        }`}
                      >
                        ${amt.toLocaleString('es-CO')}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={rechargeAmt}
                    onChange={e => setRechargeAmt(Number(e.target.value))}
                    min="5000"
                    max="100000"
                    required
                    className="w-full px-4 py-3 bg-[#070709] border border-white/5 rounded-xl font-mono text-xs font-bold text-[#98FF00] mt-2 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-nequi-pink hover:bg-pink-600 text-white font-display font-extrabold rounded-xl text-xs text-center flex items-center justify-center gap-2 shadow-lg shadow-pink-500/10 cursor-pointer uppercase tracking-wider"
                >
                  <Sparkles className="h-4 w-4 text-brand-yellow-400" />
                  <span>Cargar ${rechargeAmt.toLocaleString('es-CO')} por Nequi</span>
                </button>
              </form>
            )}

            {rechargeStep === 'loading' && (
              <div className="p-12 text-center space-y-4">
                <div className="relative inline-block">
                  <div className="w-16 h-16 rounded-full border-4 border-zinc-800 border-t-purple-500 animate-spin" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg">🟣</div>
                </div>
                <div>
                  <h4 className="font-display font-bold text-white">Conectando con Nequi...</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-normal mt-1.5">Acepta la notificación de pago en la aplicación de Nequi en tu celular para autorizar el saldo digital de forma segura.</p>
                </div>
              </div>
            )}

            {rechargeStep === 'success' && (
              <div className="p-8 text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 bg-[#121c14] border border-[#98FF00]/20 rounded-full flex items-center justify-center text-[#98FF00] mx-auto">
                  <Check className="h-8 w-8 stroke-[3px]" />
                </div>
                <div>
                  <h4 className="font-display font-black text-white text-lg">¡Recarga Exitosa!</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-normal mt-1.5">Se han añadido con éxito <strong>${rechargeAmt.toLocaleString('es-CO')} COP</strong> al saldo digital de <strong>{activeChild.name}</strong>.</p>
                </div>
                <button
                  onClick={() => setShowNequiModal(false)}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Regresar al Panel
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
