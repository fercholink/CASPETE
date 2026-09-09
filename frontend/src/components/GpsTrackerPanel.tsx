import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCodeLib from 'react-qr-code';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import GpsFamilyCircleSection from './GpsFamilyCircleSection';

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
  wifi_attendance_json: { weekdays: number[]; startTime: string; endTime: string; ssid: string }[] | null;
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
  base_monthly_price?: number;
  extra_guardian_price?: number;
  included_guardians?: number;
  active_guardians_count?: number;
  extra_guardians_count?: number;
  monthly_price: number;
  max_emergency_numbers?: number;
  student_id?: string | null;
  student_name?: string;
  student_balance?: number;
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
  const [paymentMethodTab, setPaymentMethodTab] = useState<'BALANCE' | 'WOMPI' | 'TRANSFER'>('BALANCE');
  const [balancePaySuccessMsg, setBalancePaySuccessMsg] = useState('');
  const [wompiCheckoutLoading, setWompiCheckoutLoading] = useState(false);
  const [togglingCombo, setTogglingCombo] = useState(false);
  const [comboMsg, setComboMsg] = useState('');
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

  // Asistencia por WiFi — NO es conectividad a internet (el dispositivo siempre
  // usa la SIM). Solo detecta si está al alcance de una red WiFi específica
  // (ej. la del colegio) y avisa entrada/salida. bitmask igual que la alarma
  // (bit0=lunes...bit6=domingo), se convierte a [1-7] al guardar.
  const [wifiWeekdays, setWifiWeekdays] = useState(0);
  const [wifiStartTime, setWifiStartTime] = useState('00:00');
  const [wifiEndTime, setWifiEndTime] = useState('23:59');
  const [wifiSsid, setWifiSsid] = useState('');
  const [savingWifiAttendance, setSavingWifiAttendance] = useState(false);
  const [wifiAttendanceSaved, setWifiAttendanceSaved] = useState(false);
  const [wifiAttendanceError, setWifiAttendanceError] = useState('');

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

  // Vincular a geocercas adicionales — solo SUPER_ADMIN. Un mismo localizador
  // puede estar en varias geocercas a la vez (la del colegio + cualquier
  // cantidad de zonas adicionales).
  const [geofenceOptions, setGeofenceOptions] = useState<{ id: string; name: string }[]>([]);
  const [linkedGeofences, setLinkedGeofences] = useState<{ id: string; currently_inside: boolean; geofence: { id: string; name: string; shape: 'CIRCLE' | 'POLYGON' } }[]>([]);
  const [selectedGeofenceId, setSelectedGeofenceId] = useState('');
  const [linkingGeofence, setLinkingGeofence] = useState(false);
  const [unlinkingGeofenceId, setUnlinkingGeofenceId] = useState<string | null>(null);
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
    setWifiWeekdays(0); setWifiStartTime('00:00'); setWifiEndTime('23:59'); setWifiSsid('');
    setWifiAttendanceError(''); setWifiAttendanceSaved(false);
    setGpsPlanStatus(null); setGpsPaymentType(null); setGpsPaymentScreenshot('');
    setGpsPaymentRef(''); setGpsPaymentError(''); setGpsPaymentSubmitted(false);
    setPositionRequestMsg('');
    setCenterNumber(''); setLbsEnabled(true); setSpeedThreshold(''); setVibrationAlarmEnabled(false);
    setAdvancedError(''); setAdvancedSaved(false);
    setSelectedGeofenceId(''); setLinkGeofenceMsg(''); setLinkedGeofences([]);
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
        const savedWifiSlot = tracker.wifi_attendance_json?.[0];
        if (savedWifiSlot) {
          setWifiWeekdays(savedWifiSlot.weekdays.reduce((mask, day) => mask | (1 << (day - 1)), 0));
          setWifiStartTime(savedWifiSlot.startTime);
          setWifiEndTime(savedWifiSlot.endTime);
          setWifiSsid(savedWifiSlot.ssid);
        }
        apiClient.get<{ data: GpsPlanStatus }>(`/gps-payments/trackers/${tracker.id}/status`)
          .then((r2) => setGpsPlanStatus(r2.data.data))
          .catch(() => {});
        if (isSuperAdmin) refreshLinkedGeofences(tracker.id);
      })
      .catch((err) => {
        if ((err as { response?: { status?: number } }).response?.status === 404) setGpsNotLinked(true);
        else setGpsError('No se pudo consultar el localizador');
      })
      .finally(() => setGpsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  async function handlePayWithKidwayBalance() {
    if (!gpsTracker) return;
    setGpsPaymentLoading(true);
    setGpsPaymentError('');
    setBalancePaySuccessMsg('');
    try {
      const res = await apiClient.post<{ message?: string; data: { new_balance: number; subscription_paid_until: string } }>(
        '/gps-payments/pay-with-balance',
        { trackerId: gpsTracker.id },
      );
      setBalancePaySuccessMsg(res.data.message || '¡Mensualidad GPS pagada con éxito usando tu saldo Kidway!');
      const r2 = await apiClient.get<{ data: GpsPlanStatus }>(`/gps-payments/trackers/${gpsTracker.id}/status`);
      setGpsPlanStatus(r2.data.data);
      setTimeout(() => {
        setGpsPaymentType(null);
        setBalancePaySuccessMsg('');
      }, 3500);
    } catch (err: any) {
      setGpsPaymentError(err.response?.data?.message || err.response?.data?.error || 'Error al procesar el pago con saldo');
    } finally {
      setGpsPaymentLoading(false);
    }
  }

  async function handlePayWithWompi() {
    if (!gpsTracker) return;
    setWompiCheckoutLoading(true);
    setGpsPaymentError('');
    try {
      const res = await apiClient.post<{
        data: {
          publicKey: string;
          currency: string;
          amountInCents: number;
          reference: string;
          signatureIntegrity: string;
          redirectUrl: string;
        };
      }>('/gps-payments/wompi/checkout', { trackerId: gpsTracker.id });

      const checkoutData = res.data.data;
      const checkoutUrl = `https://checkout.wompi.co/p/?public-key=${checkoutData.publicKey}&currency=${checkoutData.currency}&amount-in-cents=${checkoutData.amountInCents}&reference=${checkoutData.reference}&signature:integrity=${checkoutData.signatureIntegrity}&redirect-url=${encodeURIComponent(checkoutData.redirectUrl)}`;

      window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setGpsPaymentError(err.response?.data?.message || err.response?.data?.error || 'Error al iniciar pasarela Wompi');
    } finally {
      setWompiCheckoutLoading(false);
    }
  }

  async function handleToggleBsCombo() {
    if (!gpsTracker || !gpsPlanStatus) return;
    setTogglingCombo(true);
    setComboMsg('');
    const isCurrentlyCombo = (gpsPlanStatus.base_monthly_price === 15000);
    const newPrice = isCurrentlyCombo ? null : 15000;
    try {
      await apiClient.patch(`/gps/trackers/${gpsTracker.id}/custom-plan`, {
        custom_monthly_price: newPrice,
      });
      const r2 = await apiClient.get<{ data: GpsPlanStatus }>(`/gps-payments/trackers/${gpsTracker.id}/status`);
      setGpsPlanStatus(r2.data.data);
      setComboMsg(newPrice ? '✓ Combo BS Móvil ($15.000/mes) activado' : '✓ Tarifa estándar restablecida ($30.000/mes)');
      setTimeout(() => setComboMsg(''), 3000);
    } catch (err: any) {
      setComboMsg(err.response?.data?.message || 'Error al cambiar tarifa');
    } finally {
      setTogglingCombo(false);
    }
  }

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

  function toggleWifiWeekday(bit: number) {
    setWifiWeekdays((prev) => (prev & (1 << bit) ? prev & ~(1 << bit) : prev | (1 << bit)));
  }

  async function handleSaveWifiAttendance(e: React.FormEvent) {
    e.preventDefault();
    if (!gpsTracker || !wifiSsid.trim()) return;
    const weekdays: number[] = [];
    for (let bit = 0; bit < 7; bit++) if (wifiWeekdays & (1 << bit)) weekdays.push(bit + 1);
    setSavingWifiAttendance(true);
    setWifiAttendanceError('');
    setWifiAttendanceSaved(false);
    try {
      await apiClient.patch(`/gps/trackers/${gpsTracker.id}/wifi-attendance`, {
        slots: [{ weekdays, startTime: wifiStartTime, endTime: wifiEndTime, ssid: wifiSsid.trim() }],
      });
      setWifiAttendanceSaved(true);
    } catch (err) {
      setWifiAttendanceError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'No se pudo guardar la asistencia por WiFi');
    } finally {
      setSavingWifiAttendance(false);
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

  function refreshLinkedGeofences(trackerId: string) {
    apiClient.get<{ data: typeof linkedGeofences }>(`/gps/trackers/${trackerId}/geofences`)
      .then((r) => setLinkedGeofences(r.data.data))
      .catch(() => {});
  }

  async function handleLinkGeofence() {
    if (!gpsTracker || !selectedGeofenceId) return;
    setLinkingGeofence(true);
    setLinkGeofenceMsg('');
    try {
      await apiClient.post(`/gps-geofences/${selectedGeofenceId}/trackers`, { tracker_id: gpsTracker.id });
      setLinkGeofenceMsg('Vinculado ✓');
      setSelectedGeofenceId('');
      refreshLinkedGeofences(gpsTracker.id);
    } catch (err) {
      setLinkGeofenceMsg((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'No se pudo vincular');
    } finally {
      setLinkingGeofence(false);
    }
  }

  async function handleUnlinkGeofence(geofenceId: string) {
    if (!gpsTracker) return;
    setUnlinkingGeofenceId(geofenceId);
    try {
      await apiClient.delete(`/gps-geofences/${geofenceId}/trackers/${gpsTracker.id}`);
      refreshLinkedGeofences(gpsTracker.id);
    } catch {
      alert('No se pudo desvincular de la geocerca');
    } finally {
      setUnlinkingGeofenceId(null);
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

          {gpsPlanStatus && (
            <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: gpsPlanStatus.subscription_active ? 'rgba(24,226,153,0.08)' : '#fef2f2', border: `1px solid ${gpsPlanStatus.subscription_active ? 'var(--color-brand-deep)' : '#fca5a5'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>
                  Suscripción y Plan GPS
                </p>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600, background: gpsPlanStatus.subscription_active ? '#d1fae5' : '#fee2e2', color: gpsPlanStatus.subscription_active ? '#065f46' : '#991b1b' }}>
                  {gpsPlanStatus.subscription_active ? '● Activa' : '● Vencida o Pendiente'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                <span style={{ fontSize: 13 }}>
                  Dispositivo — {gpsPlanStatus.device_purchased ? '✅ Comprado' : `$${gpsPlanStatus.device_price.toLocaleString('es-CO')} (pago único)`}
                </span>
                {!gpsPlanStatus.device_purchased && (
                  <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px', flexShrink: 0 }} onClick={() => { setGpsPaymentType('DEVICE'); setPaymentMethodTab('WOMPI'); }}>
                    Pagar equipo
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 13 }}>
                  <div>
                    <strong>${gpsPlanStatus.monthly_price.toLocaleString('es-CO')} COP/mes</strong>
                    {Boolean(gpsPlanStatus.extra_guardians_count && gpsPlanStatus.extra_guardians_count > 0) && (
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>
                        (Base ${(gpsPlanStatus.base_monthly_price ?? 30000).toLocaleString('es-CO')} + {gpsPlanStatus.extra_guardians_count} familiar(es) extra)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: gpsPlanStatus.subscription_active ? '#047857' : '#b91c1c', marginTop: 2 }}>
                    {gpsPlanStatus.subscription_active
                      ? `Al día hasta ${new Date(gpsPlanStatus.subscription_paid_until!).toLocaleDateString('es-CO')}`
                      : gpsPlanStatus.subscription_paid_until
                        ? `Vencida el ${new Date(gpsPlanStatus.subscription_paid_until).toLocaleDateString('es-CO')}`
                        : 'Aún no has pagado la primera mensualidad'}
                  </div>
                </div>
                <button
                  className="btn-primary"
                  style={{ fontSize: 12, padding: '6px 14px', flexShrink: 0, fontWeight: 600 }}
                  onClick={() => { setGpsPaymentType('MONTHLY_SUBSCRIPTION'); setPaymentMethodTab('BALANCE'); setGpsPaymentError(''); }}
                >
                  {gpsPlanStatus.subscription_active ? 'Renovar mes' : 'Pagar mensualidad'}
                </button>
              </div>

              {/* Distintivo de tarifa Combo BS Móvil o banner promocional */}
              {gpsPlanStatus.base_monthly_price === 15000 ? (
                <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: '#ecfdf5', border: '1px solid #10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>🔥</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#065f46' }}>
                    Tarifa Combo BS Móvil Activa ($15.000 COP/mes). ¡Ahorras el 50% de la mensualidad!
                  </span>
                </div>
              ) : (
                <div style={{
                  marginTop: 10, padding: 12, borderRadius: 10,
                  background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
                  color: '#fff', border: '1px solid #10b981',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, background: '#f59e0b', color: '#0f172a', fontWeight: 800, padding: '2px 6px', borderRadius: 999, textTransform: 'uppercase' }}>
                      🔥 Oferta Combo BS Móvil
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#fde047' }}>
                      ¡Paga solo $15.000 COP/mes!
                    </span>
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: 11, lineHeight: 1.4, color: '#ecfdf5' }}>
                    Pasa tu línea a <strong>BS Comunicaciones</strong> o adquiere un plan móvil (minutos ilimitados + datos + WhatsApp) y la mensualidad de este GPS te queda en <strong>tan solo $15.000 COP</strong>.
                  </p>
                  <a
                    href="https://wa.me/573100000000?text=Hola%20BS%20Comunicaciones%2C%20tengo%20el%20GPS%20Kidway%20y%20quiero%20el%20Combo%20Plan%20M%C3%B3vil%20para%20pagar%20solo%20%2415.000%20mensuales"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#f59e0b', color: '#0f172a', fontWeight: 700,
                      fontSize: 11, padding: '5px 12px', borderRadius: 6, textDecoration: 'none',
                    }}
                  >
                    📱 Solicitar Combo en WhatsApp
                  </a>
                </div>
              )}

              {!gpsPlanStatus.subscription_active && (
                <p style={{ margin: '8px 0 0', fontSize: 11, color: '#991b1b', lineHeight: 1.4 }}>
                  ⚠️ El rastreo GPS en tiempo real y las llamadas están en pausa hasta completar la mensualidad.
                </p>
              )}

              {balancePaySuccessMsg && (
                <div style={{ marginTop: 12, padding: 12, background: '#ecfdf5', border: '1px solid #10b981', borderRadius: 8, color: '#065f46', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                  ✓ {balancePaySuccessMsg}
                </div>
              )}

              {gpsPaymentType && (
                <div style={{ marginTop: 14, padding: 14, background: '#fff', borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--color-brand-black)' }}>
                      Pagar {gpsPaymentType === 'DEVICE' ? 'Dispositivo GPS ($' + gpsPlanStatus.device_price.toLocaleString('es-CO') + ')' : 'Mensualidad ($' + gpsPlanStatus.monthly_price.toLocaleString('es-CO') + ' COP)'}
                    </p>
                    <button
                      onClick={() => { setGpsPaymentType(null); setGpsPaymentError(''); }}
                      style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--color-text-muted)', lineHeight: 1 }}
                      title="Cerrar"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Selector de métodos de pago */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 14, background: '#f1f5f9', padding: 4, borderRadius: 8 }}>
                    {gpsPaymentType === 'MONTHLY_SUBSCRIPTION' && (
                      <button
                        type="button"
                        onClick={() => { setPaymentMethodTab('BALANCE'); setGpsPaymentError(''); }}
                        style={{
                          flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                          background: paymentMethodTab === 'BALANCE' ? '#fff' : 'transparent',
                          color: paymentMethodTab === 'BALANCE' ? '#0f172a' : '#64748b',
                          boxShadow: paymentMethodTab === 'BALANCE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        }}
                      >
                        🎒 Saldo Kidway
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setPaymentMethodTab('WOMPI'); setGpsPaymentError(''); }}
                      style={{
                        flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        background: paymentMethodTab === 'WOMPI' ? '#fff' : 'transparent',
                        color: paymentMethodTab === 'WOMPI' ? '#0f172a' : '#64748b',
                        boxShadow: paymentMethodTab === 'WOMPI' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      💳 Tarjeta / PSE
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPaymentMethodTab('TRANSFER'); setGpsPaymentError(''); }}
                      style={{
                        flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        background: paymentMethodTab === 'TRANSFER' ? '#fff' : 'transparent',
                        color: paymentMethodTab === 'TRANSFER' ? '#0f172a' : '#64748b',
                        boxShadow: paymentMethodTab === 'TRANSFER' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      📱 Transferencia
                    </button>
                  </div>

                  {/* Pestaña 1: Débito de Saldo de Recargas Kidway */}
                  {paymentMethodTab === 'BALANCE' && gpsPaymentType === 'MONTHLY_SUBSCRIPTION' && (
                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Saldo actual de {gpsPlanStatus.student_name || 'estudiante'}:</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: (gpsPlanStatus.student_balance ?? 0) >= gpsPlanStatus.monthly_price ? '#059669' : '#dc2626' }}>
                          ${(gpsPlanStatus.student_balance ?? 0).toLocaleString('es-CO')} COP
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Total a debitar:</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>${gpsPlanStatus.monthly_price.toLocaleString('es-CO')} COP</span>
                      </div>

                      {(gpsPlanStatus.student_balance ?? 0) >= gpsPlanStatus.monthly_price ? (
                        <div>
                          <p style={{ margin: '0 0 10px', fontSize: 11, color: '#059669', lineHeight: 1.4 }}>
                            ⚡ <strong>Pago instantáneo en 1 clic:</strong> Se debitará del saldo disponible y tu servicio quedará renovado de inmediato sin esperar aprobaciones.
                          </p>
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ width: '100%', background: '#059669', borderColor: '#059669', padding: '10px 14px', fontSize: 13, fontWeight: 700 }}
                            disabled={gpsPaymentLoading}
                            onClick={handlePayWithKidwayBalance}
                          >
                            {gpsPaymentLoading ? 'Procesando pago...' : `Pagar $${gpsPlanStatus.monthly_price.toLocaleString('es-CO')} COP con mi Saldo`}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p style={{ margin: '0 0 10px', fontSize: 11, color: '#b91c1c', lineHeight: 1.4 }}>
                            Saldo insuficiente. Te faltan ${(gpsPlanStatus.monthly_price - (gpsPlanStatus.student_balance ?? 0)).toLocaleString('es-CO')} COP. Puedes pagar con Tarjeta/PSE en la pestaña de arriba o recargar la cuenta.
                          </p>
                          <Link to="/topups" className="btn-ghost" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', fontSize: 12, padding: '8px' }}>
                            Recargar cuenta Kidway
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pestaña 2: Pago en línea con Wompi (Tarjeta / PSE) */}
                  {paymentMethodTab === 'WOMPI' && (
                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12 }}>
                      <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                        Pasarela en línea Wompi (Bancolombia)
                      </p>
                      <p style={{ margin: '0 0 12px', fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                        Acepta Tarjeta de Crédito, Débito, PSE (cualquier banco) y Botón Bancolombia. Tu servicio se activará automáticamente al instante.
                      </p>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ width: '100%', padding: '10px 14px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        disabled={wompiCheckoutLoading}
                        onClick={handlePayWithWompi}
                      >
                        {wompiCheckoutLoading ? 'Generando pasarela...' : `💳 Pagar $${(gpsPaymentType === 'DEVICE' ? gpsPlanStatus.device_price : gpsPlanStatus.monthly_price).toLocaleString('es-CO')} en Wompi`}
                      </button>
                    </div>
                  )}

                  {/* Pestaña 3: Transferencia tradicional con comprobante */}
                  {paymentMethodTab === 'TRANSFER' && (
                    <div>
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 11, color: '#166534', lineHeight: 1.4 }}>
                        <strong>Cuentas autorizadas Kidway / BS Comunicaciones:</strong><br />
                        • Nequi / Daviplata: <strong>310 000 0000</strong><br />
                        • Bancolombia Ahorros: <strong>000-000000-00</strong>
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--color-text-muted)' }}>
                        Sube una foto o captura del comprobante de transferencia:
                      </p>
                      <input type="file" accept="image/*" onChange={handleGpsPaymentScreenshotChange} style={{ marginBottom: 8, fontSize: 12, width: '100%' }} />
                      <input
                        className="form-input" placeholder="O escribe el número de comprobante/aprobación"
                        value={gpsPaymentRef} onChange={(e) => setGpsPaymentRef(e.target.value)}
                        style={{ marginBottom: 10 }}
                      />
                      <button className="btn-primary" style={{ width: '100%', padding: '10px' }} disabled={gpsPaymentLoading} onClick={handleSubmitGpsPayment}>
                        {gpsPaymentLoading ? 'Enviando comprobante...' : 'Enviar comprobante a validación'}
                      </button>
                    </div>
                  )}

                  {gpsPaymentError && (
                    <p className="form-error" style={{ margin: '10px 0 0', fontSize: 12, textAlign: 'center' }}>
                      {gpsPaymentError}
                    </p>
                  )}
                </div>
              )}

              {gpsPaymentSubmitted && (
                <p style={{ margin: '10px 0 0', fontSize: 12, color: '#059669', fontWeight: 600, textAlign: 'center' }}>
                  Comprobante enviado — será validado pronto por administración ✓
                </p>
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

          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontWeight: 600 }}>📶 Asistencia por WiFi</p>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--color-placeholder)' }}>
            No conecta la tarjeta a internet — solo avisa cuando entra o sale del alcance de esta red WiFi (ej. la del colegio), útil dentro de edificios donde el GPS pierde precisión.
          </p>
          <form onSubmit={handleSaveWifiAttendance} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            <input
              className="form-input" type="text" placeholder="Nombre de la red WiFi (SSID)" maxLength={32}
              value={wifiSsid} onChange={(e) => setWifiSsid(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, bit) => (
                <button
                  key={bit}
                  type="button"
                  onClick={() => toggleWifiWeekday(bit)}
                  style={{
                    width: 32, height: 32, borderRadius: '50%', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    border: `1.5px solid ${wifiWeekdays & (1 << bit) ? 'var(--color-brand-deep)' : 'var(--color-border)'}`,
                    background: wifiWeekdays & (1 << bit) ? 'var(--color-brand-deep)' : 'transparent',
                    color: wifiWeekdays & (1 << bit) ? '#fff' : 'var(--color-text-muted)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="form-input" type="time" value={wifiStartTime} onChange={(e) => setWifiStartTime(e.target.value)} style={{ flex: 1 }} />
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>a</span>
              <input className="form-input" type="time" value={wifiEndTime} onChange={(e) => setWifiEndTime(e.target.value)} style={{ flex: 1 }} />
            </div>
            {wifiAttendanceError && <p className="form-error" style={{ margin: 0 }}>{wifiAttendanceError}</p>}
            {wifiAttendanceSaved && <p style={{ margin: 0, fontSize: 12, color: '#059669', fontWeight: 600 }}>Asistencia por WiFi guardada ✓</p>}
            <button type="submit" className="btn-ghost" disabled={savingWifiAttendance || !wifiSsid.trim() || wifiWeekdays === 0}>
              {savingWifiAttendance ? 'Guardando...' : 'Guardar asistencia por WiFi'}
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

              {/* Control de Tarifa Combo BS Móvil para Super Admin */}
              <div style={{ marginBottom: 20, padding: 14, borderRadius: 12, background: '#f8fafc', border: '1px solid var(--color-border)' }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                  ⭐ Tarifa Combo Familia Conectada BS Móvil (Super Admin)
                </p>
                <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                  Si la familia tiene contratado un plan móvil pospago con BS Comunicaciones, activa aquí su tarifa preferencial de <strong>$15.000 COP/mes</strong>.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  style={{
                    fontSize: 12, padding: '8px 14px', width: '100%',
                    background: gpsPlanStatus?.base_monthly_price === 15000 ? '#b91c1c' : '#059669',
                    borderColor: gpsPlanStatus?.base_monthly_price === 15000 ? '#b91c1c' : '#059669',
                    fontWeight: 700,
                  }}
                  disabled={togglingCombo}
                  onClick={handleToggleBsCombo}
                >
                  {togglingCombo
                    ? 'Actualizando...'
                    : gpsPlanStatus?.base_monthly_price === 15000
                      ? '✕ Quitar Combo BS Móvil (restablecer a $30.000 COP/mes)'
                      : '⭐ Activar Tarifa Combo BS Móvil ($15.000 COP/mes)'}
                </button>
                {comboMsg && (
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: comboMsg.includes('✓') ? '#059669' : '#dc2626', fontWeight: 600, textAlign: 'center' }}>
                    {comboMsg}
                  </p>
                )}
              </div>

              {geofenceOptions.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, fontWeight: 600 }}>
                    Geocercas adicionales
                  </p>

                  {linkedGeofences.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                      {linkedGeofences.map((link) => (
                        <div key={link.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: 13 }}>
                            {link.geofence.shape === 'CIRCLE' ? '⭕' : '▱'} {link.geofence.name}
                            {link.currently_inside && <span style={{ color: '#059669', fontWeight: 600 }}> · adentro</span>}
                          </span>
                          <button
                            className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: '#dc2626' }}
                            disabled={unlinkingGeofenceId === link.geofence.id}
                            onClick={() => handleUnlinkGeofence(link.geofence.id)}
                          >
                            {unlinkingGeofenceId === link.geofence.id ? '...' : '✕ Quitar'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <select className="form-input" style={{ flex: 1, marginBottom: 0 }} value={selectedGeofenceId} onChange={(e) => setSelectedGeofenceId(e.target.value)}>
                      <option value="">Agregar a otra geocerca...</option>
                      {geofenceOptions
                        .filter((g) => !linkedGeofences.some((link) => link.geofence.id === g.id))
                        .map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
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

          <div style={{ marginBottom: 20 }}>
            <GpsFamilyCircleSection studentId={studentId} />
          </div>

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
