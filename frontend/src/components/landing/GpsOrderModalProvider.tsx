import React, { createContext, useContext, useState } from 'react';

interface GpsOrderModalContextValue {
  openGpsOrderModal: () => void;
}

const GpsOrderModalContext = createContext<GpsOrderModalContextValue | null>(null);

export function useGpsOrderModal() {
  const ctx = useContext(GpsOrderModalContext);
  if (!ctx) throw new Error('useGpsOrderModal debe usarse dentro de GpsOrderModalProvider');
  return ctx;
}

interface PaymentMethodField { label: string; value: string }
interface PaymentMethodInfo { id: string; key: string; label: string; icon: string; color: string; fields: PaymentMethodField[] }

const DEVICE_PRICE = 120000;

const EMPTY_FORM = {
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  city: '',
  address: '',
  student_name: '',
  payment_reference: '',
  website: '', // honeypot: campo oculto, solo lo llenan bots
};

function resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        } else if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height); height = maxHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function apiBase() {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
}

export function GpsOrderModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodInfo | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoadedAt, setFormLoadedAt] = useState(0);
  const [screenshot, setScreenshot] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');

  function openGpsOrderModal() {
    setForm(EMPTY_FORM);
    setScreenshot('');
    setSelectedMethod(null);
    setStep(1);
    setSent(false);
    setFormError('');
    setFormLoadedAt(Date.now());
    setOpen(true);
    fetch(`${apiBase()}/payment-methods/public`)
      .then((r) => r.json())
      .then((json: { success: boolean; data?: PaymentMethodInfo[] }) => setPaymentMethods(json.data ?? []))
      .catch(() => {});
  }

  async function handleScreenshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setScreenshot(await resizeImage(file, 800, 800));
    } catch {
      setFormError('No se pudo procesar la imagen del comprobante');
    }
  }

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!screenshot && !form.payment_reference.trim()) {
      setFormError('Debes subir el comprobante o ingresar el número de referencia de la transferencia');
      return;
    }
    setSending(true);
    setFormError('');
    try {
      const res = await fetch(`${apiBase()}/gps-device-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          payment_reference: form.payment_reference || undefined,
          student_name: form.student_name || undefined,
          receipt_url: screenshot || form.payment_reference,
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

  function close() {
    setOpen(false);
  }

  return (
    <GpsOrderModalContext.Provider value={{ openGpsOrderModal }}>
      {children}

      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          className="fixed inset-0 z-[9999] bg-[#0c1c14]/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white border border-[#faeae1] rounded-[2rem] p-8 sm:p-10 w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl relative text-left">
            {sent ? (
              <div className="text-center py-10 space-y-4">
                <div className="text-6xl animate-bounce">📦</div>
                <h3 className="font-display text-2xl font-black text-emerald-600">¡Pago Recibido!</h3>
                <p className="text-xs text-[#61494c] leading-relaxed mb-6 font-semibold">
                  Muchas gracias. Nuestro equipo verificará tu comprobante y te enviará el localizador a la dirección indicada. Te avisaremos por correo cuando esté en camino, con instrucciones para registrarte en Kidway y vincularlo.
                </p>
                <button
                  onClick={close}
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
                      <span>📍 Comprar el Localizador</span>
                    </h3>
                    <p className="text-xs text-[#8c6d71] mt-1 font-mono font-bold">
                      Pago único: <span className="text-emerald-700 font-extrabold">${DEVICE_PRICE.toLocaleString('es-CO')} COP</span>
                    </p>
                  </div>
                  <button
                    onClick={close}
                    className="bg-transparent border-none text-2xl cursor-pointer text-[#8c6d71] hover:text-[#4e2f33] transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {step === 1 ? (
                  <div className="space-y-4 text-left">
                    <p className="text-xs text-[#61494c] font-semibold">
                      Transfiere el valor del dispositivo a una de estas cuentas. En el siguiente paso subes el comprobante y tus datos de envío.
                    </p>
                    {paymentMethods.length === 0 ? (
                      <p className="text-xs text-[#8c6d71]">Cargando métodos de pago...</p>
                    ) : !selectedMethod ? (
                      <div className="space-y-2">
                        {paymentMethods.map((pm) => (
                          <button
                            key={pm.key}
                            onClick={() => setSelectedMethod(pm)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left cursor-pointer transition-colors"
                            style={{ borderColor: `${pm.color}50`, background: `${pm.color}0d` }}
                          >
                            <span className="text-xl">{pm.icon}</span>
                            <span className="text-xs font-bold text-[#4e2f33]">{pm.label}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-xl border p-4" style={{ borderColor: `${selectedMethod.color}50`, background: `${selectedMethod.color}0d` }}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">{selectedMethod.icon}</span>
                            <span className="text-xs font-black text-[#4e2f33]">{selectedMethod.label}</span>
                          </div>
                          {selectedMethod.fields.map((field) => (
                            <div key={field.label} className="flex justify-between items-center mb-1.5">
                              <span className="text-[11px] text-[#8c6d71] font-semibold">{field.label}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-[#4e2f33] font-mono">{field.value}</span>
                                <button
                                  type="button"
                                  title="Copiar"
                                  onClick={() => navigator.clipboard.writeText(field.value)}
                                  className="bg-transparent border-none cursor-pointer text-xs"
                                  style={{ color: selectedMethod.color }}
                                >
                                  📋
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => setSelectedMethod(null)}
                          className="text-[11px] text-[#8c6d71] font-bold underline bg-transparent border-none cursor-pointer p-0"
                        >
                          ← Elegir otro método
                        </button>
                        <button
                          onClick={() => setStep(2)}
                          className="w-full py-4 rounded-xl text-white font-display font-black text-xs uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 transition-all cursor-pointer border-none shadow-md"
                        >
                          Ya transferí — continuar
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={submitOrder} className="space-y-4 text-left">
                    <input
                      type="text" name="website" value={form.website}
                      onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                      tabIndex={-1} autoComplete="off" aria-hidden="true"
                      style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
                    />
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[11px] text-[#8c6d71] font-bold underline bg-transparent border-none cursor-pointer p-0"
                    >
                      ← Volver a los datos de la cuenta
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">Tu Nombre Completo *</label>
                        <input
                          required type="text" value={form.contact_name}
                          onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value.replace(/[^A-Za-zÀ-ÿ\s'.]/g, '') }))}
                          placeholder="Laura Gómez"
                          className="w-full bg-[#fffbf8] border border-[#faeae1] rounded-xl px-4 py-3 text-xs text-[#3f2e2e] placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">Nombre del Niño/a</label>
                        <input
                          type="text" value={form.student_name}
                          onChange={(e) => setForm((f) => ({ ...f, student_name: e.target.value }))}
                          placeholder="Mariana Gómez"
                          className="w-full bg-[#fffbf8] border border-[#faeae1] rounded-xl px-4 py-3 text-xs text-[#3f2e2e] placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">Correo Electrónico *</label>
                        <input
                          required type="email" value={form.contact_email}
                          onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                          placeholder="laura@correo.com"
                          className="w-full bg-[#fffbf8] border border-[#faeae1] rounded-xl px-4 py-3 text-xs text-[#3f2e2e] placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">Teléfono / WhatsApp *</label>
                        <input
                          required type="text" value={form.contact_phone}
                          onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value.replace(/[^0-9+\s()-]/g, '') }))}
                          placeholder="3001234567"
                          className="w-full bg-[#fffbf8] border border-[#faeae1] rounded-xl px-4 py-3 text-xs text-[#3f2e2e] placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">Ciudad *</label>
                        <input
                          required type="text" value={form.city}
                          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value.replace(/[^A-Za-zÀ-ÿ\s'-]/g, '') }))}
                          placeholder="Bogotá"
                          className="w-full bg-[#fffbf8] border border-[#faeae1] rounded-xl px-4 py-3 text-xs text-[#3f2e2e] placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">N° de Referencia</label>
                        <input
                          type="text" value={form.payment_reference}
                          onChange={(e) => setForm((f) => ({ ...f, payment_reference: e.target.value }))}
                          placeholder="Opcional si subes el comprobante"
                          className="w-full bg-[#fffbf8] border border-[#faeae1] rounded-xl px-4 py-3 text-xs text-[#3f2e2e] placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">Dirección de Envío *</label>
                      <input
                        required type="text" value={form.address}
                        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                        placeholder="Calle 10 # 20-30, Apto 401, Barrio..."
                        className="w-full bg-[#fffbf8] border border-[#faeae1] rounded-xl px-4 py-3 text-xs text-[#3f2e2e] placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#8c6d71] uppercase tracking-wide">Comprobante de Pago</label>
                      <input
                        type="file" accept="image/*" onChange={handleScreenshotChange}
                        className="w-full bg-[#fffbf8] border border-[#faeae1] rounded-xl px-4 py-3 text-xs text-[#3f2e2e] focus:outline-none focus:border-emerald-500 transition-colors font-bold file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:text-emerald-700 file:text-[11px] file:font-bold"
                      />
                      {screenshot && <p className="text-[11px] text-emerald-600 font-bold">✓ Comprobante listo</p>}
                    </div>

                    {formError && <p className="text-rose-500 text-xs font-semibold">{formError}</p>}

                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full py-4 rounded-xl text-white font-display font-black text-xs uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none shadow-md"
                    >
                      {sending ? 'Enviando...' : '📦 Confirmar Pedido'}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </GpsOrderModalContext.Provider>
  );
}
