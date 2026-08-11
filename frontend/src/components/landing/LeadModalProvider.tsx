import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export type LeadPlan = 'COMMISSION' | 'MONTHLY';

interface LeadModalContextValue {
  openLeadModal: (plan: LeadPlan) => void;
}

const LeadModalContext = createContext<LeadModalContextValue | null>(null);

export function useLeadModal() {
  const ctx = useContext(LeadModalContext);
  if (!ctx) throw new Error('useLeadModal debe usarse dentro de LeadModalProvider');
  return ctx;
}

const EMPTY_FORM = {
  school_name: '',
  nit: '',
  city: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  students_count: '',
  message: '',
  website: '', // honeypot: campo oculto, solo lo llenan bots
};

export function LeadModalProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [leadModal, setLeadModal] = useState<null | LeadPlan>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoadedAt, setFormLoadedAt] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');

  function openLeadModal(plan: LeadPlan) {
    setForm(EMPTY_FORM);
    setFormLoadedAt(Date.now());
    setSent(false);
    setFormError('');
    setLeadModal(plan);
  }

  // Abre el formulario automáticamente si llegan con ?demo=1 (link para compartir con colegios)
  useEffect(() => {
    if (new URLSearchParams(location.search).get('demo') === '1') {
      openLeadModal('COMMISSION');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

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
          plan_interest: leadModal,
          form_loaded_at: formLoadedAt,
        }),
      });
      const json = (await res.json()) as { success: boolean; message?: string };
      if (!json.success) throw new Error(json.message ?? 'Error al enviar');
      setSent(true);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setSending(false);
    }
  }

  return (
    <LeadModalContext.Provider value={{ openLeadModal }}>
      {children}

      {leadModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setLeadModal(null); }}
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
                  {/* Honeypot anti-spam: invisible para personas, los bots suelen autocompletarlo */}
                  <input
                    type="text"
                    name="website"
                    value={form.website}
                    onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">Nombre del Colegio *</label>
                      <input
                        required
                        type="text"
                        value={form.school_name}
                        onChange={(e) => setForm((f) => ({ ...f, school_name: e.target.value.replace(/[^A-Za-z0-9À-ÿ\s.,#&'-]/g, '') }))}
                        placeholder="Colegio San José"
                        className="w-full bg-[#fffbf8] border border-[#faeae1] rounded-xl px-4 py-3 text-xs text-[#3f2e2e] placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">NIT del Colegio</label>
                      <input
                        type="text"
                        value={form.nit}
                        onChange={(e) => setForm((f) => ({ ...f, nit: e.target.value.replace(/[^0-9.-]/g, '') }))}
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
                        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value.replace(/[^A-Za-zÀ-ÿ\s'-]/g, '') }))}
                        placeholder="Bogotá"
                        className="w-full bg-[#fffbf8] border border-[#faeae1] rounded-xl px-4 py-3 text-xs text-[#3f2e2e] placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">N° de Estudiantes Aprox.</label>
                      <input
                        type="text"
                        value={form.students_count}
                        onChange={(e) => setForm((f) => ({ ...f, students_count: e.target.value.replace(/\D/g, '') }))}
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
                      onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value.replace(/[^A-Za-zÀ-ÿ\s'.]/g, '') }))}
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
                        onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                        placeholder="rector@colegio.edu.co"
                        className="w-full bg-[#fffbf8] border border-[#faeae1] rounded-xl px-4 py-3 text-xs text-[#3f2e2e] placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">Teléfono / WhatsApp</label>
                      <input
                        type="text"
                        value={form.contact_phone}
                        onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value.replace(/[^0-9+\s()-]/g, '') }))}
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
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
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
    </LeadModalContext.Provider>
  );
}
