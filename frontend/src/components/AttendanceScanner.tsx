import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { apiClient } from '../api/client';

interface ScannedStudent {
  id: string;
  full_name: string;
  grade: string | null;
  photo_url: string | null;
}

interface AttendanceScannerProps {
  courseId: string;
  onClose: () => void;
}

const CARD_PREFIX = 'CASPETE:CARD:';

export default function AttendanceScanner({ courseId, onClose }: AttendanceScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [scannedList, setScannedList] = useState<ScannedStudent[]>([]);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    const html5QrCode = new Html5Qrcode('attendance-qr-reader');
    scannerRef.current = html5QrCode;

    html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        if (processingRef.current) return;

        if (!decodedText.startsWith(CARD_PREFIX)) {
          setFeedback({ type: 'error', message: 'Este código no es de una tarjeta CASPETE' });
          setTimeout(() => setFeedback(null), 1800);
          return;
        }

        processingRef.current = true;
        const qrToken = decodedText.slice(CARD_PREFIX.length);
        try {
          const r = await apiClient.post<{ data: { student: ScannedStudent } }>('/attendance/scan', {
            qr_token: qrToken,
            course_id: courseId,
          });
          const student = r.data.data.student;
          setFeedback({ type: 'success', message: `${student.full_name.split(' ')[0]} — asistencia registrada` });
          setScannedList((prev) => [student, ...prev]);
        } catch (err) {
          const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al registrar asistencia';
          setFeedback({ type: 'error', message: msg });
        } finally {
          setTimeout(() => {
            setFeedback(null);
            processingRef.current = false;
          }, 1800);
        }
      },
      () => {}, // ignorar frames sin QR detectado
    ).catch(() => {
      setCameraError('No se pudo acceder a la cámara. Revisa los permisos del navegador.');
    });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [courseId]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: 16, overflowY: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 20, padding: 20, marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 17 }}>📷 Tomar asistencia</h3>
          <button className="btn-ghost" style={{ padding: '4px 10px' }} onClick={onClose}>Cerrar</button>
        </div>

        {cameraError ? (
          <p className="form-error" style={{ marginTop: 0 }}>{cameraError}</p>
        ) : (
          <div id="attendance-qr-reader" style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }} />
        )}

        <p style={{ textAlign: 'center', fontSize: 12, color: '#6b7280', marginTop: 10 }}>
          Escanea la tarjeta de cada estudiante — puedes seguir escaneando sin cerrar esta ventana.
        </p>
      </div>

      {feedback && (
        <div style={{
          marginTop: 16, width: '100%', maxWidth: 420, padding: '14px 18px', borderRadius: 14,
          background: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `2px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 22 }}>{feedback.type === 'success' ? '✅' : '❌'}</span>
          <p style={{ margin: 0, fontWeight: 600, color: feedback.type === 'success' ? '#166534' : '#991b1b', fontSize: 14 }}>
            {feedback.message}
          </p>
        </div>
      )}

      {scannedList.length > 0 && (
        <div style={{ width: '100%', maxWidth: 420, marginTop: 16 }}>
          <p style={{ color: '#fff', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
            Registrados en esta sesión ({scannedList.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {scannedList.map((s, i) => (
              <div key={`${s.id}-${i}`} style={{ background: '#fff', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                {s.photo_url ? (
                  <img src={s.photo_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                    {s.full_name.charAt(0)}
                  </div>
                )}
                <span style={{ fontSize: 13, fontWeight: 500 }}>{s.full_name}</span>
                {s.grade && <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>{s.grade}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
