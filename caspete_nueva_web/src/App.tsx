import React, { useState } from 'react';
import { 
  Sparkles, 
  School, 
  Heart, 
  QrCode, 
  ShieldCheck, 
  Menu, 
  X, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Scale,
  Smile
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import ParentDashboard from './components/ParentDashboard';
import CanteenDashboard from './components/CanteenDashboard';
import { INITIAL_CHILDREN, INITIAL_TRANSACTIONS } from './data/mockData';
import { Child, Transaction } from './types';

export default function App() {
  const [view, setView] = useState<'landing' | 'parent' | 'canteen'>('landing');
  const [children, setChildren] = useState<Child[]>(INITIAL_CHILDREN);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [scannedChildId, setScannedChildId] = useState<string | null>(null);
  
  // Mobile responsive nav menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Synced handlers
  const handleUpdateChildren = (updated: Child[]) => {
    setChildren(updated);
  };

  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions([newTx, ...transactions]);
  };

  // Switcher context trigger to send a kid to canteen scan
  const handleSelectCanteenChild = (childId: string) => {
    setScannedChildId(childId);
    setView('canteen');
  };

  const handleClearScannedChildId = () => {
    setScannedChildId(null);
  };

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
          <button 
            onClick={() => { setView('landing'); }}
            className="flex items-center gap-2.5 focus:outline-hidden cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#98FF00] text-black flex items-center justify-center shadow-lg shadow-[#98FF00]/10 group-hover:scale-105 transition-transform font-bold">
              <span className="text-xl font-display font-black">C</span>
            </div>
            <div>
              <span className="font-display font-black text-2xl tracking-tight text-white group-hover:text-[#98FF00] transition-colors">
                CASPETE<span className="text-[#98FF00]">.</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-extrabold block leading-none tracking-wider uppercase">Loncheras Digitales</span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#111111] p-1.5 rounded-2xl border border-white/5">
            <button
              id="nav-landing"
              onClick={() => setView('landing')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                view === 'landing' ? 'bg-[#98FF00] text-black shadow-lg shadow-[#98FF00]/10' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Inicio
            </button>
            <button
              id="nav-parent"
              onClick={() => { setView('parent'); handleClearScannedChildId(); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                view === 'parent' ? 'bg-[#98FF00] text-black shadow-lg shadow-[#98FF00]/10' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Heart className="h-3.5 w-3.5" />
              <span>Portal Padres</span>
            </button>
            <button
              id="nav-canteen"
              onClick={() => setView('canteen')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                view === 'canteen' ? 'bg-[#98FF00] text-black shadow-lg' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <School className="h-3.5 w-3.5" />
              <span>Cafetería POS</span>
            </button>
          </nav>

          {/* External Callout action */}
          <div className="hidden md:flex items-center gap-3">
            <div className="nequi-gradient text-[10px] text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 select-none shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#98FF00] animate-pulse" />
              <span>Pago con Nequi</span>
            </div>
          </div>

          {/* Mobile responsive nav toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-300 hover:bg-zinc-800 rounded-lg focus:outline-hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0c0c0d] border-b border-white/5 p-4 space-y-3 animate-fade-in text-left">
            <button
              onClick={() => { setView('landing'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold block ${
                view === 'landing' ? 'bg-[#98FF00] text-black' : 'text-zinc-400'
              }`}
            >
              Inicio Web
            </button>
            <button
              onClick={() => { setView('parent'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 ${
                view === 'parent' ? 'bg-[#98FF00] text-black' : 'text-zinc-400'
              }`}
            >
              <Heart className="h-4 w-4" />
              <span>Portal Padres</span>
            </button>
            <button
              onClick={() => { setView('canteen'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 ${
                view === 'canteen' ? 'bg-[#98FF00] text-black' : 'text-zinc-400'
              }`}
            >
              <School className="h-4 w-4" />
              <span>Cafetería POS</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Switch-Router Content Window */}
      <main className="flex-grow">
        {view === 'landing' && <LandingPage onStartDemo={(viewType) => {
          if (viewType) setView(viewType);
          else setView('parent');
        }} />}
        
        {view === 'parent' && (
          <ParentDashboard 
            children={children} 
            onUpdateChildren={handleUpdateChildren} 
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onSelectCanteenChild={handleSelectCanteenChild}
          />
        )}

        {view === 'canteen' && (
          <CanteenDashboard 
            children={children} 
            onUpdateChildren={handleUpdateChildren} 
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            scannedChildId={scannedChildId}
            onClearScannedChildId={handleClearScannedChildId}
          />
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
              La plataforma colombiana pionera en la nutrición, control digital, saldos prepago y trazabilidad con QR seguro para colegios campesinos, privados e institucionales de Colombia.
            </p>
          </div>

          {/* Dynamic features links */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Flujos de Pruebas</h5>
            <ul className="space-y-3 text-xs">
              <li>
                <button onClick={() => setView('landing')} className="hover:text-[#98FF00] transition-colors cursor-pointer text-left focus:outline-hidden">
                  Página de Inicio Principal
                </button>
              </li>
              <li>
                <button onClick={() => { setView('parent'); handleClearScannedChildId(); }} className="hover:text-[#98FF00] transition-colors cursor-pointer text-left focus:outline-hidden">
                  Panel de Padres (Carga Nequi)
                </button>
              </li>
              <li>
                <button onClick={() => setView('canteen')} className="hover:text-[#98FF00] transition-colors cursor-pointer text-left focus:outline-hidden">
                  POS Cafetería (Escaneo de QR)
                </button>
              </li>
            </ul>
          </div>

          {/* Legal references */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Seguridad y Normativa</h5>
            <ul className="space-y-3 text-xs text-zinc-400">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#98FF00]" />
                <span>Ley 1581 (Garantía de Datos de Menores)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-[#98FF00]" />
                <span>Ley 2120 (Alimentos Saludables Escolares)</span>
              </li>
              <li className="flex items-center gap-1.5 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#98FF00]" />
                <span>Aprobación directa de menús por Nutricionistas</span>
              </li>
            </ul>
          </div>

          {/* Developers / Brand note */}
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-white uppercase tracking-widest">Compromiso Tecnológico</h5>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Diseñado con colores originales de Caspete y la identidad transaccional Colombiana. Hecho para despliegues fluidos en todo tipo de tabletas y dispositivos móviles.
            </p>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 rounded-md bg-[#161616] text-[9px] uppercase font-bold text-[#98FF00] border border-white/5">Nequi OK</span>
              <span className="px-2.5 py-1 rounded-md bg-[#161616] text-[9px] uppercase font-bold text-white border border-white/5">QR Secure</span>
            </div>
          </div>

        </div>

        {/* Small bottom text */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <span>&copy; {new Date().getFullYear()} Caspete S.A.S. Todos los derechos reservados. Colombia.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#98FF00] transition-colors">Términos y condiciones</a>
            <a href="#" className="hover:text-[#98FF00] transition-colors">Política de Habeas Data</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
