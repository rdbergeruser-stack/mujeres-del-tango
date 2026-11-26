'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Crop, Move, RotateCcw, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface ImageCropper191Props {
  imageSrc: string;
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
  onCancel?: () => void;
}

const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 628; // 1.91:1 exacto
const TARGET_RATIO = TARGET_WIDTH / TARGET_HEIGHT;

export default function ImageCropper191({
  imageSrc,
  onCropComplete,
  onCancel,
}: ImageCropper191Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  // Reiniciar estado cuando cambia la imagen fuente
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setNaturalSize(null);
  }, [imageSrc]);

  // Calcular dimensiones base (para que la imagen cubra todo el marco 1.91:1 en zoom = 1)
  const getBaseDisplaySize = () => {
    if (!naturalSize || !containerRef.current) return { baseW: 0, baseH: 0, boxW: 0, boxH: 0 };
    const boxW = containerRef.current.clientWidth;
    const boxH = containerRef.current.clientHeight;
    const imgRatio = naturalSize.w / naturalSize.h;

    let baseW: number;
    let baseH: number;
    if (imgRatio > TARGET_RATIO) {
      // Imagen más ancha que 1.91:1 -> ajustar por alto
      baseH = boxH;
      baseW = boxH * imgRatio;
    } else {
      // Imagen más alta (vertical o 3:2) -> ajustar por ancho
      baseW = boxW;
      baseH = boxW / imgRatio;
    }

    return { baseW, baseH, boxW, boxH };
  };

  // Limitar el desplazamiento para que nunca queden bordes negros vacíos
  const clampOffset = (nextX: number, nextY: number, currentZoom: number) => {
    const { baseW, baseH, boxW, boxH } = getBaseDisplaySize();
    if (!baseW || !baseH) return { x: 0, y: 0 };

    const scaledW = baseW * currentZoom;
    const scaledH = baseH * currentZoom;
    const maxX = Math.max(0, (scaledW - boxW) / 2);
    const maxY = Math.max(0, (scaledH - boxH) / 2);

    return {
      x: Math.max(-maxX, Math.min(maxX, nextX)),
      y: Math.max(-maxY, Math.min(maxY, nextY)),
    };
  };

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(1, Math.min(3, newZoom));
    setZoom(clampedZoom);
    setOffset((prev) => clampOffset(prev.x, prev.y, clampedZoom));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const nextX = e.clientX - dragStart.x;
    const nextY = e.clientY - dragStart.y;
    setOffset(clampOffset(nextX, nextY, zoom));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      setDragging(false);
    }
  };

  const handleApplyCrop = async () => {
    if (!imgRef.current || !naturalSize || !containerRef.current) return;
    setProcessing(true);

    try {
      const { baseW, baseH, boxW, boxH } = getBaseDisplaySize();
      const scaledW = baseW * zoom;
      const scaledH = baseH * zoom;

      // Posición de la imagen escalada respecto al borde superior izquierdo del contenedor
      const imgLeft = (boxW - scaledW) / 2 + offset.x;
      const imgTop = (boxH - scaledH) / 2 + offset.y;

      // Convertir el área visible del contenedor a coordenadas de la imagen original
      const scaleToNaturalX = naturalSize.w / scaledW;
      const scaleToNaturalY = naturalSize.h / scaledH;

      const srcX = Math.max(0, -imgLeft * scaleToNaturalX);
      const srcY = Math.max(0, -imgTop * scaleToNaturalY);
      const srcW = Math.min(naturalSize.w - srcX, boxW * scaleToNaturalX);
      const srcH = Math.min(naturalSize.h - srcY, boxH * scaleToNaturalY);

      const canvas = document.createElement('canvas');
      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo inicializar el lienzo de recorte');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        imgRef.current,
        srcX,
        srcY,
        srcW,
        srcH,
        0,
        0,
        TARGET_WIDTH,
        TARGET_HEIGHT
      );

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Error al generar la imagen recortada'))),
          'image/jpeg',
          0.86
        );
      });

      const file = new File([blob], `slider-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      onCropComplete(file, previewUrl);
    } catch (err) {
      console.error('Error recortando imagen:', err);
      alert('No se pudo procesar el recorte de esta imagen. Intentá subir el archivo desde tu dispositivo.');
    } finally {
      setProcessing(false);
    }
  };

  const { baseW, baseH } = getBaseDisplaySize();

  return (
    <div className="space-y-3 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
          <Crop className="w-4 h-4 text-[#FF00FF]" />
          <span>Encuadre y Recorte (Proporción 1.91:1 — 1200×628 px)</span>
        </div>
        <span className="text-[11px] text-zinc-500 flex items-center gap-1">
          <Move className="w-3.5 h-3.5" />
          <span>Arrastrá la foto para encuadrar</span>
        </span>
      </div>

      {/* Marco interactivo 1.91:1 */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ aspectRatio: '1.91 / 1' }}
        className={`relative w-full overflow-hidden rounded-xl bg-zinc-950 border-2 border-[#199DD0] select-none touch-none ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <img
          ref={imgRef}
          src={imageSrc}
          alt="Vista previa para recorte"
          crossOrigin="anonymous"
          draggable={false}
          onLoad={(e) => {
            const target = e.currentTarget;
            setNaturalSize({ w: target.naturalWidth, h: target.naturalHeight });
          }}
          style={
            naturalSize && baseW > 0
              ? {
                  width: `${baseW * zoom}px`,
                  height: `${baseH * zoom}px`,
                  left: `calc(50% + ${offset.x}px)`,
                  top: `calc(50% + ${offset.y}px)`,
                  transform: 'translate(-50%, -50%)',
                }
              : {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }
          }
          className="absolute max-w-none pointer-events-none"
        />

        {/* Grilla de tercios sutil */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
          <div className="border-r border-b border-white/20" />
          <div className="border-r border-b border-white/20" />
          <div className="border-b border-white/20" />
          <div className="border-r border-b border-white/20" />
          <div className="border-r border-b border-white/20" />
          <div className="border-b border-white/20" />
          <div className="border-r border-white/20" />
          <div className="border-r border-white/20" />
          <div />
        </div>
      </div>

      {/* Controles de Zoom y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <button
            type="button"
            onClick={() => handleZoomChange(zoom - 0.15)}
            className="p-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
            title="Alejar"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            className="flex-1 accent-[#FF00FF]"
          />
          <button
            type="button"
            onClick={() => handleZoomChange(zoom + 0.15)}
            className="p-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
            title="Acercar"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-zinc-600 w-10 text-right">
            {zoom.toFixed(1)}x
          </span>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="p-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-600 hover:text-zinc-900"
            title="Restablecer encuadre"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="py-2 px-3 rounded-lg border border-zinc-300 bg-white text-zinc-700 text-xs font-medium hover:bg-zinc-100"
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={processing || !naturalSize}
            className="py-2 px-4 rounded-lg bg-gradient-to-r from-[#FF00FF] to-[#199DD0] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{processing ? 'Recortando...' : 'Aplicar Recorte 1.91:1'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
