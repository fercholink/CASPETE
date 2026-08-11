import { useEffect, useRef, useState } from 'react';

interface Props {
  src: string;
  aspectW: number;
  aspectH: number;
  viewportWidth?: number;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
}

const EXPORT_SCALE = 2;
const MAX_ZOOM = 4;

/** Recorte + zoom + mover — sin dependencias externas, exporta un JPEG con el encuadre elegido. */
export default function ImageCropper({ src, aspectW, aspectH, viewportWidth = 280, onCancel, onConfirm }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const viewportW = viewportWidth;
  const viewportH = Math.round((viewportWidth * aspectH) / aspectW);

  useEffect(() => {
    setNatural(null);
    setZoom(1);
    const img = new Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  function dims(currentZoom: number) {
    if (!natural) return { dispW: viewportW, dispH: viewportH, baseScale: 1 };
    const baseScale = Math.max(viewportW / natural.w, viewportH / natural.h);
    const scale = baseScale * currentZoom;
    return { dispW: natural.w * scale, dispH: natural.h * scale, baseScale };
  }

  function clamp(p: { x: number; y: number }, dispW: number, dispH: number) {
    const minX = Math.min(0, viewportW - dispW);
    const minY = Math.min(0, viewportH - dispH);
    return { x: Math.max(minX, Math.min(0, p.x)), y: Math.max(minY, Math.min(0, p.y)) };
  }

  useEffect(() => {
    if (!natural) return;
    const { dispW, dispH } = dims(zoom);
    setPos({ x: (viewportW - dispW) / 2, y: (viewportH - dispH) / 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [natural]);

  function handleZoomChange(z: number) {
    const { dispW, dispH } = dims(z);
    setZoom(z);
    setPos((p) => clamp(p, dispW, dispH));
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, posX: pos.x, posY: pos.y };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current || !natural) return;
    const { dispW, dispH } = dims(zoom);
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos(clamp({ x: dragRef.current.posX + dx, y: dragRef.current.posY + dy }, dispW, dispH));
  }

  function onPointerUp() {
    dragRef.current = null;
    setDragging(false);
  }

  function handleConfirm() {
    if (!imgRef.current || !natural) return;
    const { dispW, dispH } = dims(zoom);
    const canvas = document.createElement('canvas');
    canvas.width = viewportW * EXPORT_SCALE;
    canvas.height = viewportH * EXPORT_SCALE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(
      imgRef.current,
      pos.x * EXPORT_SCALE, pos.y * EXPORT_SCALE,
      dispW * EXPORT_SCALE, dispH * EXPORT_SCALE,
    );
    onConfirm(canvas.toDataURL('image/jpeg', 0.88));
  }

  const { dispW, dispH } = dims(zoom);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
      <div className="user-card" style={{ maxWidth: 400, width: '100%', padding: '24px', marginBottom: 0 }}>
        <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Ajusta la foto</p>

        <div
          style={{ width: viewportW, height: viewportH, overflow: 'hidden', position: 'relative', borderRadius: 14, background: '#111', margin: '0 auto', touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {natural && (
            <img
              ref={imgRef}
              src={src}
              alt="Recortar"
              draggable={false}
              style={{ position: 'absolute', left: pos.x, top: pos.y, width: dispW, height: dispH, maxWidth: 'none', pointerEvents: 'none' }}
            />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input
            type="range" min={1} max={MAX_ZOOM} step={0.01} value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Arrastra la foto para moverla · usa la barra para acercar
        </p>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancelar</button>
          <button className="btn-primary" style={{ flex: 1 }} disabled={!natural} onClick={handleConfirm}>
            ✓ Usar esta foto
          </button>
        </div>
      </div>
    </div>
  );
}
