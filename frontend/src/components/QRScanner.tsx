import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { apiClient } from '../api/client';

interface StudentPreview {
  id: string;
  full_name: string;
  grade: string | null;
  photo_url: string | null;
  school: { name: string };
}

interface OrderPreview {
  id: string;
  scheduled_date: string;
  total_amount: string;
  store: { name: string };
  order_items: { quantity: number; store_product: { product: { name: string } } | null }[];
}

interface PreviewData {
  student: StudentPreview;
  orders: OrderPreview[];
  ready_to_deliver: number;
}

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
  onClose: () => void;
}

function fmt(price: string) {
  return `$${parseFloat(price).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'long' });
}

export default function QRScanner({ onScan, onError, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [scannedText, setScannedText] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [delivering, setDelivering] = useState(false);
  const [photoZoom, setPhotoZoom] = useState(false);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode('qr-reader');
    scannerRef.current = html5QrCode;

    html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        await html5QrCode.stop().catch(console.error);

        // Formato CASPETE:STUDENT:studentId:deliveryCode → mostrar preview
        if (decodedText.startsWith('CASPETE:STUDENT:')) {
          const parts = decodedText.split(':');
          if (parts.length >= 4) {
            const studentId   = parts[2];
            const deliveryCode = parts[3];
            setScannedText(decodedText);
            setLoadingPreview(true);
            setPreviewError('');
            try {
              const r = await apiClient.post<{ data: PreviewData }>('/orders/preview-delivery', {
                student_id: studentId,
                delivery_code: deliveryCode,
              });
              setPreview(r.data.data);
            } catch (err) {
              const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al verificar';
              setPreviewError(msg);
            } finally {
              setLoadingPreview(false);
            }
            return;
          }
        }

        // Otro formato → pasar directamente
        onScan(decodedText);
      },
      (errorMessage) => {
        if (onError) onError(errorMessage);
      },
    ).catch((err) => {
      console.error('Error starting QR scanner', err);
      if (onError) onError('No se pudo acceder a la cámara');
    });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  async function handleConfirmDelivery() {
    setDelivering(true);
    try {
      await onScan(scannedText); // el parent hace el deliver real
    } finally {
      setDelivering(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>

      {/* ── Estado: cargando preview ── */}
      {loadingPreview && (
        <div style={{ background: '#fff', borderRadius: 20, padding: 32, textAlign: 'center', maxWidth: 380, width: '100%' }}>
          <p style={{ fontSize: 32, margin: '0 0 12px' }}>🔍</p>
          <p style={{ margin: 0, fontWeight: 600 }}>Verificando código...</p>
        </div>
      )}

      {/* ── Estado: error de verificación ── */}
      {previewError && (
        <div style={{ background: '#fff', borderRadius: 20, padding: 32, textAlign: 'center', maxWidth: 380, width: '100%' }}>
          <p style={{ fontSize: 32, margin: '0 0 12px' }}>❌</p>
          <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#dc2626' }}>Código inválido</p>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>{previewError}</p>
          <button className="btn-ghost" onClick={onClose} style={{ width: '100%' }}>Cerrar</button>
        </div>
      )}

      {/* ── Estado: preview del estudiante ── */}
      {preview && !loadingPreview && (
        <div style={{ background: '#fff', borderRadius: 20, padding: 24, maxWidth: 400, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>

          {/* Foto + nombre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: 16, background: '#f0fdf4', borderRadius: 16, border: '2px solid #bbf7d0' }}>
            {/* Foto clickeable para ampliar */}
            <div
              onClick={() => preview.student.photo_url && setPhotoZoom(true)}
              style={{
                position: 'relative', flexShrink: 0,
                cursor: preview.student.photo_url ? 'zoom-in' : 'default',
              }}
              title={preview.student.photo_url ? 'Toca para ampliar' : ''}
            >
              {preview.student.photo_url ? (
                <img
                  src={preview.student.photo_url}
                  alt={preview.student.full_name}
                  style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #1a4731', display: 'block' }}
                />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#1a4731', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#fff' }}>
                  {preview.student.full_name.charAt(0)}
                </div>
              )}
              {/* Indicador de zoom */}
              {preview.student.photo_url && (
                <div style={{
                  position: 'absolute', bottom: 2, right: 2,
                  background: 'rgba(26,71,49,0.85)', borderRadius: '50%',
                  width: 20, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10,
                }}>
                  🔍
                </div>
              )}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0d1f16', lineHeight: 1.2 }}>
                {preview.student.full_name}
              </p>
              {preview.student.grade && (
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
                  Grado: <strong>{preview.student.grade}</strong>
                </p>
              )}
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
                {preview.student.school.name}
              </p>
            </div>
          </div>

          {/* Lightbox: foto ampliada */}
          {photoZoom && preview.student.photo_url && (
            <div
              onClick={() => setPhotoZoom(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 10000,
                background: 'rgba(0,0,0,0.92)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'zoom-out',
              }}
            >
              <img
                src={preview.student.photo_url}
                alt={preview.student.full_name}
                style={{
                  maxWidth: '90vw', maxHeight: '75vh',
                  borderRadius: 20, objectFit: 'contain',
                  border: '4px solid #1a4731',
                  boxShadow: '0 0 60px rgba(0,0,0,0.8)',
                }}
              />
              <p style={{ color: '#fff', marginTop: 16, fontSize: 20, fontWeight: 700 }}>
                {preview.student.full_name}
              </p>
              {preview.student.grade && (
                <p style={{ color: 'rgba(255,255,255,0.6)', margin: '4px 0 0', fontSize: 14 }}>
                  Grado {preview.student.grade} · {preview.student.school.name}
                </p>
              )}
              <p style={{ color: 'rgba(255,255,255,0.4)', margin: '20px 0 0', fontSize: 12 }}>
                Toca en cualquier lugar para cerrar
              </p>
            </div>
          )}

          {/* Pedidos a entregar */}
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {preview.ready_to_deliver} pedido(s) para entregar
          </p>

          {preview.orders.length === 0 ? (
            <div style={{ background: '#fef2f2', borderRadius: 12, padding: 16, textAlign: 'center', marginBottom: 16 }}>
              <p style={{ margin: 0, color: '#dc2626', fontWeight: 600, fontSize: 14 }}>
                ⚠️ Sin pedidos confirmados pendientes
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {preview.orders.map((order) => (
                <div key={order.id} style={{ background: '#f9fafb', borderRadius: 12, padding: 14, border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{order.store.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: '#1a4731' }}>{fmt(order.total_amount)}</span>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: 11, color: '#9ca3af' }}>📅 {fmtDate(order.scheduled_date)}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {order.order_items.map((item, i) => (
                      <p key={i} style={{ margin: 0, fontSize: 12, color: '#4b5563' }}>
                        × {item.quantity} {item.store_product?.product.name ?? 'Producto'}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botones de acción */}
          {preview.ready_to_deliver > 0 && (
            <button
              className="btn-primary"
              style={{ width: '100%', marginBottom: 10, fontSize: 16, padding: '14px 0' }}
              onClick={handleConfirmDelivery}
              disabled={delivering}
            >
              {delivering ? 'Entregando...' : `✅ Confirmar entrega (${preview.ready_to_deliver})`}
            </button>
          )}
          <button className="btn-ghost" onClick={onClose} style={{ width: '100%' }}>
            Cancelar
          </button>
        </div>
      )}

      {/* ── Estado: escáner de cámara ── */}
      {!preview && !loadingPreview && !previewError && (
        <div style={{ background: '#fff', padding: 20, borderRadius: 20, width: '100%', maxWidth: 400 }}>
          <h3 style={{ margin: '0 0 4px', textAlign: 'center', fontSize: 18 }}>📷 Escanear QR</h3>
          <p style={{ margin: '0 0 16px', textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
            Apunta al código QR del estudiante
          </p>
          <div id="qr-reader" style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }} />
          <button className="btn-ghost" onClick={onClose} style={{ marginTop: 16, width: '100%' }}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
