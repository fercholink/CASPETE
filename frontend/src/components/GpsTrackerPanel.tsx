import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCodeLib from 'react-qr-code';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

const QRCode = (QRCodeLib as any).default || QRCodeLib;

interface TrackerData {
  id: string;
  qr_token: string;
  device_name: string | null;
  phone_number: string | null;
  battery_level: number | null;
  signal_strength: number | null;
  online: boolean;
  last_seen_at: string | null;
  extended_tracking_until: string | null;
  active: boolean;
  sos_number: string | null;
  dad_number: string | null;
  mom_number: string | null;
  center_number: string | null;
  alarm_clock_json: { weekdays: number; hour: number; minute: number }[] | null;
  iccid: string | null;
  lbs_enabled: boolean | null;
  speed_threshold_kmh: number | null;
  vibration_alarm_enabled: boolean | null;
}

interface GpsPlanStatus {
  is_gps_only_plan: boolean;
  device_purchased: boolean;
  subscription_paid_until: string | null;
  subscription_active: boolean;
  device_price: number;
  monthly_price: number;
}

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
      img.onerror = () => reject('Error al cargar la imagen');
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject('Error al leer el archivo');
    reader.readAsDataURL(file);
  });
}

interface Props {
  studentId: string;
  onClose: () => void;
}

/**
 * Panel completo del localizador GPS de un estudiante: info del dispositivo,
 * acciones (buscar, posición bajo demanda, apagar), SOS, alarma, configuración
 * avanzada (SUPER_ADMIN) y vinculación a geocercas. Compartido entre el modal
 * de StudentsPage y la pestaña "Diagnóstico" del módulo GPS del panel admin.
 */
export default function GpsTrackerPanel({ studentId, onClose }: Props) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [gpsTracker, setGpsTracker] = useState<TrackerData | null>(null);
  const [gpsNotLinked, setGpsNotLinked] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [imei, setImei] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gpsPlanStatus, setGpsPlanStatus] = useState<GpsPlanStatus | null>(null);
  const [gpsPaymentType, setGpsPaymentType] = useState<'DEVICE' | 'MONTHLY_SUBSCRIPTION' | null>(null);
  const [gpsPaymentScreenshot, setGpsPaymentScreenshot] = useState('');
  const [gpsPaymentRef, setGpsPaymentRef] = useState('');
  const [gpsPaymentLoading, setGpsPaymentLoading] = useState(false);
  const [gpsPaymentError, setGpsPaymentError] = useState('');
  const [gpsPaymentSubmitted, setGpsPaymentSubmitted] = useState(false);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [findingDevice, setFindingDevice] = useState(false);
  const [deviceSounding, setDeviceSounding] = useState(false);
  const [findError, setFindError] = useState('');
  const [poweringOff, setPoweringOff] = useState(false);
  const [powerError, setPowerError] = useState('');
  const [alarmWeekdays, setAlarmWeekdays] = useState(0); // bitmask, bit0=lunes...bit6=domingo
  const [alarmTime, setAlarmTime] = useState('');
  const [savingAlarm, setSavingAlarm] = useState(false);
  const [alarmSaved, setAlarmSaved] = useState(false);
  const [alarmError, setAlarmError] = useState('');

  // Números de contacto (SOS/papá/mamá) — el dispositivo llama a estos al presionar su botón físico de SOS
  const [sosNumber, setSosNumber] = useState('');
  const [dadNumber, setDadNumber] = useState('');
  const [momNumber, setMomNumber] = useState('');
  const [savingContacts, setSavingContacts] = useState(false);
  const [contactsError, setContactsError] = useState('');
  const [contactsSaved, setContactsSaved] = useState(false);

  // Posición bajo demanda — pedirle al dispositivo que reporte ya mismo
  const [requestingPosition, setRequestingPosition] = useState(false);
  const [positionRequestMsg, setPositionRequestMsg] = useState('');

  // Configuración avanzada del equipo — solo SUPER_ADMIN
  const [centerNumber, setCenterNumber] = useState('');
  const [lbsEnabled, setLbsEnabled] = useState(true);
  const [speedThreshold, setSpeedThreshold] = useState('');
  const [vibrationAlarmEnabled, setVibrationAlarmEnabled] = useState(false);
  const [savingAdvanced, setSavingAdvanced] = useState(false);
  const [advancedError, setAdvancedError] = useState('');
  const [advancedSaved, setAdvancedSaved] = useState(false);

  // Vincular a una geocerca adicional — solo SUPER_ADMIN
  const [geofenceOptions, setGeofenceOptions] = useState<{ id: string; name: string }[]>([]);
  const [selectedGeofenceId, setSelectedGeofenceId] = useState('');
  const [linkingGeofence, setLinkingGeofence] = useState(false);
  const [linkGeofenceMsg, setLinkGeofenceMsg] = useState('');

  useEffect(() => {
    setGpsTracker(null);
    setGpsNotLinked(false);
    setGpsError('');
    setImei('');
    setDeviceName('');
    setPhoneNumber('');
    setSosNumber(''); setDadNumber(''); setMomNumber('');
    setContactsError(''); setContactsSaved(false);
    setDeviceSounding(false); setFindError('');
    setPowerError('');
    setAlarmWeekdays(0); setAlarmTime(''); setAlarmError(''); setAlarmSaved(false);
    setGpsPlanStatus(null); setGpsPaymentType(null); setGpsPaymentScreenshot('');
    setGpsPaymentRef(''); setGpsPaymentError(''); setGpsPaymentSubmitted(false);
    setPositionRequestMsg('');
    setCenterNumber(''); setLbsEnabled(true); setSpeedThreshold(''); setVibrationAlarmEnabled(false);
    setAdvancedError(''); setAdvancedSaved(false);
    setSelectedGeofenceId(''); setLinkGeofenceMsg('');
    if (isSuperAdmin) {
      apiClient.get<{ data: { id: string; name: string }[] }>('/gps-geofences')
        .then((r) => setGeofenceOptions(r.data.data))
        .catch(() => {});
    }
    setGpsLoading(true);
    apiClient.get<{ data: { tracker: TrackerData } }>(`/gps/trackers/student/${studentId}`)
      .then((r) => {
        const tracker = r.data.data.tracker;
        setGpsTracker(tracker);
        setSosNumber(tracker.sos_number ?? '');
        setDadNumber(tracker.dad_number ?? '');
        setMomNumber(tracker.mom_number ?? '');
        setPhoneNumber(tracker.phone_number ?? '');
        setCenterNumber(tracker.center_number ?? '');
        setLbsEnabled(tracker.lbs_enabled ?? true);
        setSpeedThreshold(tracker.speed_threshold_kmh ? String(tracker.speed_threshold_kmh) : '');
        setVibrationAlarmEnabled(tracker.vibration_alarm_enabled ?? false);
        const savedAlarm = tracker.alarm_clock_json?.[0];
        setAlarmWeekdays(savedAlarm?.weekdays ?? 0);
        setAlarmTime(savedAlarm ? `${String(savedAlarm.hour).padStart(2, '0')}:${String(savedAlarm.minute).padStart(2, '0')}` : '');
        apiClient.get<{ data: GpsPlanStatus }>(`/gps-payments/trackers/${tracker.id}/status`)
          .then((r2) => setGpsPlanStatus(r2.data.data))
          .catch(() => {});
      })
      .catch((err) => {
        if ((err as { response?: { status?: number } }).response?.status === 404) setGpsNotLinked(true);
        else setGpsError('No se pudo consultar el localizador');
      })
      .finally(() => setGpsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  async function handleSubmitGpsPayment() {
    if (!gpsTracker || !gpsPaymentType) return;
    if (!gpsPaymentScreenshot && !gpsPaymentRef.trim()) {
      setGpsPaymentError('Debes subir el comprobante o ingresar el número de referencia');
      return;
    }
    setGpsPaymentLoading(true);
    setGpsPaymentError('');
    try {
      await apiClient.post('/gps-payments', {
        trackerId: gpsTracker.id,
        type: gpsPaymentType,
        receiptUrl: gpsPaymentScreenshot,
        paymentReference: gpsPaymentRef.trim() || undefined,
      });
      setGpsPaymentSubmitted(true);
      setGpsPaymentType(null);
      setGpsPaymentScreenshot('');
      setGpsPaymentRef('');
    } catch (err) {
      setGpsPaymentError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al enviar el comprobante');
    } finally {
      setGpsPaymentLoading(false);
    }
  }

  async function handleGpsPaymentScreenshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeImage(file, 800, 800);
      setGpsPaymentScreenshot(base64);
    } catch {
      alert('Error al procesar la imagen del comprobante');
    }
  }

  async function handleLinkTracker(e: React.FormEvent) {
    e.preventDefault();
    if (imei.length !== 15) { setGpsError('El IMEI debe tener 15 dígitos'); return; }
    setLinking(true);
    setGpsError('');
    try {
      const r = await apiClient.post<{ data: TrackerData }>('/gps/trackers', {
        student_id: studentId,
        imei,
        device_name: deviceName || undefined,
        phone_number: phoneNumber || undefined,
      });
      setGpsTracker(r.data.data);
      setGpsNotLinked(false);
    } catch (err) {
      setGpsError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al vincular el localizador');
    } finally {
      setLinking(false);
    }
  }

  async function handleSaveContacts(e: React.FormEvent) {
    e.preventDefault();
    if (!gpsTracker) return;
    setSavingContacts(true);
    setContactsError('');
    setContactsSaved(false);
    try {
      await apiClient.patch(`/gps/trackers/${gpsTracker.id}/emergency-contacts`, {
        ...(sosNumber ? { sos_number: sosNumber } : {}),
        ...(dadNumber ? { dad_number: dadNumber } : {}),
        ...(momNumber ? { mom_number: momNumber } : {}),
      });
      await apiClient.patch(`/gps/trackers/${gpsTracker.id}/phone-number`, {
        phone_number: phoneNumber || null,
      });
      setGpsTracker((prev) => prev ? { ...prev, phone_number: phoneNumber || null } : prev);
      setContactsSaved(true);
    } catch (err) {
      setContactsError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al guardar los números de contacto');
    } finally {
      setSavingContacts(false);
    }
  }

  async function handleRequestPosition() {
    if (!gpsTracker) return;
    setRequestingPosition(true);
    setPositionRequestMsg('');
    try {
      await apiClient.patch(`/gps/trackers/${gpsTracker.id}/request-position`);
      setPositionRequestMsg('Posición solicitada — puede tardar unos segundos en actualizarse en el mapa ✓');
    } catch (err) {
      setPositionRequestMsg((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'No se pudo solicitar la posición');
    } finally {
      setRequestingPosition(false);
    }
  }

  async function handleFindDevice() {
    if (!gpsTracker) return;
    const nextActive = !deviceSounding;
    setFindingDevice(true);
    setFindError('');
    try {
      await apiClient.patch(`/gps/trackers/${gpsTracker.id}/find`, { active: nextActive });
      setDeviceSounding(nextActive);
    } catch (err) {
      setFindError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'No se pudo contactar a la tarjeta');
    } finally {
      setFindingDevice(false);
    }
  }

  async function handlePowerOff() {
    if (!gpsTracker) return;
    if (!confirm('¿Apagar la tarjeta? No hay forma de volver a encenderla desde la app — habrá que presionar su botón físico o conectarla al cargador.')) return;
    setPoweringOff(true);
    setPowerError('');
    try {
      await apiClient.patch(`/gps/trackers/${gpsTracker.id}/power`, { action: 'shutdown' });
    } catch (err) {
      setPowerError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'No se pudo apagar la tarjeta');
    } finally {
      setPoweringOff(false);
    }
  }

  function toggleAlarmWeekday(bit: number) {
    setAlarmWeekdays((prev) => (prev & (1 << bit) ? prev & ~(1 << bit) : prev | (1 << bit)));
  }

  async function handleSaveAlarm(e: React.FormEvent) {
    e.preventDefault();
    if (!gpsTracker || !alarmTime) return;
    const [hour, minute] = alarmTime.split(':').map(Number);
    setSavingAlarm(true);
    setAlarmError('');
    setAlarmSaved(false);
    try {
      await apiClient.patch(`/gps/trackers/${gpsTracker.id}/alarm-clock`, {
        alarms: [{ weekdays: alarmWeekdays, hour, minute }],
      });
      setAlarmSaved(true);
    } catch (err) {
      setAlarmError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'No se pudo guardar la alarma');
    } finally {
      setSavingAlarm(false);
    }
  }

  async function handleSaveAdvancedConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!gpsTracker) return;
    setSavingAdvanced(true);
    setAdvancedError('');
    setAdvancedSaved(false);
    try {
      await Promise.all([
        apiClient.patch(`/gps/trackers/${gpsTracker.id}/emergency-contacts`, {
          center_number: centerNumber || null,
        }),
        apiClient.patch(`/gps/trackers/${gpsTracker.id}/lbs`, { enabled: lbsEnabled }),
        ...(speedThreshold ? [apiClient.patch(`/gps/trackers/${gpsTracker.id}/speed-threshold`, { speed_kmh: Number(speedThreshold) })] : []),
        apiClient.patch(`/gps/trackers/${gpsTracker.id}/vibration-alarm`, { enabled: vibrationAlarmEnabled }),
      ]);
      setAdvancedSaved(true);
    } catch (err) {
      setAdvancedError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'No se pudo guardar la configuración');
    } finally {
      setSavingAdvanced(false);
    }
  }

  async function handleLinkGeofence() {
    if (!gpsTracker || !selectedGeofenceId) return;
    setLinkingGeofence(true);
    setLinkGeofenceMsg('');
    try {
      await apiClient.post(`/gps-geofences/${selectedGeofenceId}/trackers`, { tracker_id: gpsTracker.id });
      setLinkGeofenceMsg('Vinculado ✓');
    } catch (err) {
      setLinkGeofenceMsg((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'No se pudo vincular');
    } finally {
      setLinkingGeofence(false);
    }
  }

  async function handleUnlinkTracker() {
    if (!gpsTracker) return;
    if (!confirm('¿Desvincular este localizador? El estudiante dejará de ser rastreado hasta que vincules uno nuevo.')) return;
    setUnlinking(true);
    try {
      await apiClient.delete(`/gps/trackers/${gpsTracker.id}`);
      setGpsTracker(null);
      setGpsNotLinked(true);
    } catch {
      alert('No se pudo desvincular el localizador');
    } finally {
      setUnlinking(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.4px' }}>📍 Localizador GPS</h2>
        <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 18, lineHeight: 1 }} onClick={onClose}>×</button>
      </div>

      {gpsLoading && <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Consultando...</p>}
      {gpsError && <p className="form-error" style={{ marginTop: 0 }}>{gpsError}</p>}

      {/* Ya tiene un localizador vinculado */}
      {gpsTracker && !gpsLoading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid var(--color-border)' }}>
              <QRCode value={`KIDWAY:CARD:${gpsTracker.qr_token}`} size={160} />
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 20 }}>
            Este es el código que va impreso en la tarjeta del estudiante — el colegio lo usa para asistencia y el tendero para identificarlo en la entrega.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Dispositivo</span>
              <span style={{ fontWeight: 600 }}>{gpsTracker.device_name ?? 'Sin nombre'}</span>
            </div>
            {gpsTracker.phone_number && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Número de la SIM</span>
                <a href={`tel:${gpsTracker.phone_number}`} style={{ fontWeight: 600, color: 'var(--color-brand-deep)', textDecoration: 'none' }}>
                  📞 {gpsTracker.phone_number}
                </a>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Estado</span>
              <span style={{ fontWeight: 600, color: gpsTracker.online ? '#059669' : 'var(--color-text-muted)' }}>
                {gpsTracker.online ? '🟢 En línea' : '⚪ Sin conexión'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Batería</span>
              <span style={{ fontWeight: 600 }}>{gpsTracker.battery_level ?? '—'}%</span>
            </div>
            {isSuperAdmin && gpsTracker.signal_strength !== null && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Señal</span>
                <span style={{ fontWeight: 600 }}>{gpsTracker.signal_strength}%</span>
              </div>
            )}
            {isSuperAdmin && gpsTracker.iccid && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>ICCID de la SIM</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 11 }}>{gpsTracker.iccid}</span>
              </div>
            )}
          </div>

          <button
            className="btn-ghost"
            style={{ width: '100%', marginBottom: 10 }}
            disabled={findingDevice || !gpsTracker.online}
            onClick={handleFindDevice}
          >
            {findingDevice ? 'Enviando...' : deviceSounding ? '🔇 Detener sonido' : '🔊 Buscar tarjeta (hacerla sonar)'}
          </button>
          {!gpsTracker.online && (
            <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--color-placeholder)', textAlign: 'center' }}>
              La tarjeta debe estar en línea para poder encontrarla.
            </p>
          )}
          {findError && <p className="form-error" style={{ marginTop: 0, marginBottom: 10, textAlign: 'center' }}>{findError}</p>}

          <button
            className="btn-ghost"
            style={{ width: '100%', marginBottom: 10 }}
            disabled={requestingPosition || !gpsTracker.online}
            onClick={handleRequestPosition}
          >
            {requestingPosition ? 'Solicitando...' : '📍 Actualizar ubicación ahora'}
          </button>
          {positionRequestMsg && (
            <p style={{ margin: '0 0 10px', fontSize: 11, color: positionRequestMsg.includes('✓') ? '#059669' : '#dc2626', textAlign: 'center' }}>
              {positionRequestMsg}
            </p>
          )}

          <Link to="/tracking" className="btn-primary" style={{ textDecoration: 'none', textAlign: 'center', display: 'block', marginBottom: 20 }}>
            Ver ubicación en el mapa
          </Link>

          {gpsPlanStatus?.is_gps_only_plan && (
            <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: gpsPlanStatus.subscription_active ? 'rgba(24,226,153,0.08)' : '#fef2f2', border: `1px solid ${gpsPlanStatus.subscription_active ? 'var(--color-brand-deep)' : '#fca5a5'}` }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>
                Plan solo localizar y llamar
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                <span style={{ fontSize: 13 }}>
                  Dispositivo — {gpsPlanStatus.device_purchased ? '✅ Comprado' : `$${gpsPlanStatus.device_price.toLocaleString('es-CO')} (pago único)`}
                </span>
                {!gpsPlanStatus.device_purchased && (
                  <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px', flexShrink: 0 }} onClick={() => setGpsPaymentType('DEVICE')}>
                    Pagar
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13 }}>
                  Mensualidad (${gpsPlanStatus.monthly_price.toLocaleString('es-CO')}/mes) —{' '}
                  {gpsPlanStatus.subscription_active
                    ? `✅ Al día hasta ${new Date(gpsPlanStatus.subscription_paid_until!).toLocaleDateString('es-CO')}`
                    : gpsPlanStatus.subscription_paid_until
                      ? '⚠️ Vencida'
                      : '⚠️ Sin pagar'}
                </span>
                <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px', flexShrink: 0 }} onClick={() => setGpsPaymentType('MONTHLY_SUBSCRIPTION')}>
                  {gpsPlanStatus.subscription_active ? 'Renovar' : 'Pagar'}
                </button>
              </div>

              {!gpsPlanStatus.subscription_active && (
                <p style={{ margin: '8px 0 0', fontSize: 11, color: '#991b1b' }}>
                  El rastreo y las llamadas están en pausa hasta que se pague la mensualidad.
                </p>
              )}

              {gpsPaymentType && (
                <div style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600 }}>
                    Comprobante de pago — {gpsPaymentType === 'DEVICE'
                      ? `Dispositivo ($${gpsPlanStatus.device_price.toLocaleString('es-CO')})`
                      : `Mensualidad ($${gpsPlanStatus.monthly_price.toLocaleString('es-CO')})`}
                  </p>
                  <input type="file" accept="image/*" onChange={handleGpsPaymentScreenshotChange} style={{ marginBottom: 8, fontSize: 12, width: '100%' }} />
                  <input
                    className="form-input" placeholder="O ingresa el número de referencia"
                    value={gpsPaymentRef} onChange={(e) => setGpsPaymentRef(e.target.value)}
                    style={{ marginBottom: 8 }}
                  />
                  {gpsPaymentError && <p className="form-error" style={{ margin: '0 0 8px' }}>{gpsPaymentError}</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { setGpsPaymentType(null); setGpsPaymentError(''); }}>
                      Cancelar
                    </button>
                    <button className="btn-primary" style={{ flex: 1 }} disabled={gpsPaymentLoading} onClick={handleSubmitGpsPayment}>
                      {gpsPaymentLoading ? 'Enviando...' : 'Enviar comprobante'}
                    </button>
                  </div>
                </div>
              )}
              {gpsPaymentSubmitted && (
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#059669', fontWeight: 600 }}>Comprobante enviado — será validado pronto ✓</p>
              )}
            </div>
          )}

          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontWeight: 600 }}>Botón de SOS de la tarjeta</p>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--color-placeholder)' }}>
            Al presionar el botón físico de la tarjeta, marca al Número 1. Si no contesta, puedes agregar un segundo y tercer número de respaldo.
          </p>
          <form onSubmit={handleSaveContacts} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {gpsTracker?.phone_number !== undefined && (
              <input
                className="form-input" type="tel" placeholder="📞 Número de la SIM del dispositivo (llamadas)"
                value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              />
            )}
            <input className="form-input" type="tel" placeholder="Número 1 (SOS)" value={sosNumber} onChange={(e) => setSosNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} />
            <input className="form-input" type="tel" placeholder="Número 2" value={dadNumber} onChange={(e) => setDadNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} />
            <input className="form-input" type="tel" placeholder="Número 3" value={momNumber} onChange={(e) => setMomNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} />
            {contactsError && <p className="form-error" style={{ margin: 0 }}>{contactsError}</p>}
            {contactsSaved && <p style={{ margin: 0, fontSize: 12, color: '#059669', fontWeight: 600 }}>Números guardados ✓</p>}
            <button type="submit" className="btn-ghost" disabled={savingContacts || (!sosNumber && !dadNumber && !momNumber && !phoneNumber)}>
              {savingContacts ? 'Guardando...' : 'Guardar números'}
            </button>
          </form>

          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontWeight: 600 }}>Alarma de despertador</p>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--color-placeholder)' }}>
            Si la tarjeta tiene parlante, suena a la hora que elijas los días marcados.
          </p>
          <form onSubmit={handleSaveAlarm} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, bit) => (
                <button
                  key={bit}
                  type="button"
                  onClick={() => toggleAlarmWeekday(bit)}
                  style={{
                    width: 32, height: 32, borderRadius: '50%', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    border: `1.5px solid ${alarmWeekdays & (1 << bit) ? 'var(--color-brand-deep)' : 'var(--color-border)'}`,
                    background: alarmWeekdays & (1 << bit) ? 'var(--color-brand-deep)' : 'transparent',
                    color: alarmWeekdays & (1 << bit) ? '#fff' : 'var(--color-text-muted)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <input className="form-input" type="time" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} />
            {alarmError && <p className="form-error" style={{ margin: 0 }}>{alarmError}</p>}
            {alarmSaved && <p style={{ margin: 0, fontSize: 12, color: '#059669', fontWeight: 600 }}>Alarma guardada ✓</p>}
            <button type="submit" className="btn-ghost" disabled={savingAlarm || !alarmTime || alarmWeekdays === 0}>
              {savingAlarm ? 'Guardando...' : 'Guardar alarma'}
            </button>
          </form>

          {isSuperAdmin && (
            <>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontWeight: 600 }}>
                ⚙️ Configuración avanzada (Admin)
              </p>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--color-placeholder)' }}>
                Ajustes técnicos del equipo — no algo que un padre normalmente necesite tocar.
              </p>
              <form onSubmit={handleSaveAdvancedConfig} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                <input
                  className="form-input" type="tel" placeholder="Número de monitoreo (opcional)"
                  value={centerNumber} onChange={(e) => setCenterNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={lbsEnabled} onChange={(e) => setLbsEnabled(e.target.checked)} />
                  Posicionamiento por celdas/WiFi (LBS) — respaldo cuando no hay señal GPS
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={vibrationAlarmEnabled} onChange={(e) => setVibrationAlarmEnabled(e.target.checked)} />
                  Alarma de vibración
                </label>
                <input
                  className="form-input" type="number" min={1} max={255} placeholder="Umbral de sobrevelocidad (km/h)"
                  value={speedThreshold} onChange={(e) => setSpeedThreshold(e.target.value)}
                />
                {advancedError && <p className="form-error" style={{ margin: 0 }}>{advancedError}</p>}
                {advancedSaved && <p style={{ margin: 0, fontSize: 12, color: '#059669', fontWeight: 600 }}>Configuración guardada ✓</p>}
                <button type="submit" className="btn-ghost" disabled={savingAdvanced}>
                  {savingAdvanced ? 'Guardando...' : 'Guardar configuración avanzada'}
                </button>
              </form>

              {geofenceOptions.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, fontWeight: 600 }}>
                    Vincular a geocerca adicional
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select className="form-input" style={{ flex: 1, marginBottom: 0 }} value={selectedGeofenceId} onChange={(e) => setSelectedGeofenceId(e.target.value)}>
                      <option value="">Elige una geocerca...</option>
                      {geofenceOptions.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <button className="btn-ghost" disabled={!selectedGeofenceId || linkingGeofence} onClick={handleLinkGeofence}>
                      {linkingGeofence ? '...' : 'Vincular'}
                    </button>
                  </div>
                  {linkGeofenceMsg && (
                    <p style={{ margin: '6px 0 0', fontSize: 11, color: linkGeofenceMsg.includes('✓') ? '#059669' : '#dc2626' }}>{linkGeofenceMsg}</p>
                  )}
                </div>
              )}
            </>
          )}

          <button className="btn-ghost" style={{ width: '100%', color: '#dc2626', marginBottom: 10 }} disabled={poweringOff || !gpsTracker.online} onClick={handlePowerOff}>
            {poweringOff ? 'Apagando...' : '⏻ Apagar tarjeta'}
          </button>
          <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--color-placeholder)', textAlign: 'center' }}>
            No se puede volver a encender desde la app — solo con el botón físico o el cargador.
          </p>
          {powerError && <p className="form-error" style={{ marginTop: 0, marginBottom: 10, textAlign: 'center' }}>{powerError}</p>}

          <button className="btn-ghost" style={{ width: '100%', color: '#dc2626' }} disabled={unlinking} onClick={handleUnlinkTracker}>
            {unlinking ? 'Desvinculando...' : 'Desvincular localizador'}
          </button>
        </div>
      )}

      {/* Sin localizador — formulario de vinculación */}
      {gpsNotLinked && !gpsLoading && (
        <form onSubmit={handleLinkTracker}>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Ingresa los datos de la tarjeta localizadora que compraste. El rastreo solo funciona durante el horario escolar del colegio.
          </p>
          <div className="form-group">
            <label className="form-label" htmlFor="imei">IMEI (15 dígitos)</label>
            <input
              id="imei" className="form-input" value={imei}
              onChange={(e) => setImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
              placeholder="123456789012345" autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="device-name">Nombre (opcional)</label>
            <input
              id="device-name" className="form-input" value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="Ej: Mochila de Sofía" style={{ marginBottom: 0 }}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="phone-number">Número de la SIM del dispositivo (opcional)</label>
            <input
              id="phone-number" className="form-input" value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Solo si tu tarjeta tiene SIM con llamadas" style={{ marginBottom: 0 }}
            />
          </div>

          {gpsError && <p className="form-error">{gpsError}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={linking}>
              {linking ? 'Vinculando...' : 'Vincular'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
