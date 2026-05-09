import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onError, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        // Detener scanner tras lectura exitosa para evitar escaneos múltiples
        html5QrCode.stop().then(() => {
          onScan(decodedText);
        }).catch(err => console.error(err));
      },
      (errorMessage) => {
        if (onError) onError(errorMessage);
      }
    ).catch(err => {
      console.error("Error starting QR scanner", err);
      if (onError) onError("No se pudo acceder a la cámara");
    });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan, onError]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ background: '#fff', padding: 20, borderRadius: 16, width: '100%', maxWidth: 400 }}>
        <h3 style={{ margin: '0 0 16px', textAlign: 'center' }}>Escanear QR del Pedido</h3>
        <div id="qr-reader" style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}></div>
        <button className="btn-ghost" onClick={onClose} style={{ marginTop: 16, width: '100%' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
