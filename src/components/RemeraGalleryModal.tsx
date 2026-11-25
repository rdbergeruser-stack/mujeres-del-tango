'use client';

import React, { useState, useRef } from 'react';
import { Remera, Collection } from '@/types/database';
import { formatCurrency, buildWhatsAppLink } from '@/lib/utils';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShoppingBag,
  MessageCircle,
  Sparkles,
  Info,
  Check,
  ChevronLeft,
  ChevronRight,
  Move
} from 'lucide-react';

interface RemeraGalleryModalProps {
  remera: Remera | null;
  initialColor?: string;
  initialSize?: string;
  collections?: Collection[];
  currentUser?: any;
  onClose: () => void;
  onOpenCheckout: (remera: Remera, color: string, size: string) => void;
  onViewCollection?: (collection: Collection) => void;
}

export default function RemeraGalleryModal({
  remera,
  initialColor,
  initialSize,
  collections = [],
  currentUser,
  onClose,
  onOpenCheckout,
  onViewCollection,
}: RemeraGalleryModalProps) {
  if (!remera) return null;

  const [selectedColor, setSelectedColor] = useState<string>(
    initialColor || remera.colors[0] || 'Blanco'
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    initialSize || remera.sizes[0] || 'M'
  );

  // Estados de Zoom
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(2.4);
  const [zoomPosition, setZoomPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Obtener la imagen correspondiente al color seleccionado
  const getCurrentImage = () => {
    const colorLower = selectedColor.toLowerCase();
    if (remera.gallery_urls && remera.gallery_urls.length > 0) {
      const match = remera.gallery_urls.find((url) => {
        const u = url.toLowerCase();
        if (colorLower.includes('blanco') && u.includes('blanca')) return true;
        if (colorLower.includes('negro') && u.includes('negra')) return true;
        if (colorLower.includes('amarillo') && u.includes('amarilla')) return true;
        return false;
      });
      if (match) return match;
    }
    return remera.image_url || '/images/hero-banner.jpg';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPosition({ x, y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100));
    setZoomPosition({ x, y });
  };

  const toggleZoom = () => {
    setIsZoomed((prev) => !prev);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZoomed(true);
    setZoomLevel((prev) => Math.min(4, prev + 0.5));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => {
      const next = Math.max(1.5, prev - 0.5);
      if (next <= 1.5) setIsZoomed(false);
      return next;
    });
  };

  const activeCollection = collections.find((c) => c.name === remera.collection_name);

  const currentDisplayImage = getCurrentImage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-zinc-950 rounded-2xl max-w-5xl w-full border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden my-auto flex flex-col lg:flex-row relative">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-xl bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700/60 shadow-lg transition-colors"
          title="Cerrar (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* COLUMNA IZQUIERDA: VISUALIZADOR DE ESTAMPA CON ZOOM */}
        <div className="lg:w-3/5 p-4 sm:p-6 bg-gradient-to-b from-zinc-900/50 to-zinc-950 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-zinc-800/80">
          <div>
            {/* Cabecera del visor */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FF00FF]/15 border border-[#FF00FF]/30 text-[#FF00FF] font-semibold text-[11px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Estampa Oficial de Alta Resolución</span>
              </span>

              {/* Controles de Zoom */}
              <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Reducir Zoom"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono font-bold text-zinc-300 px-1">
                  {isZoomed ? `${zoomLevel.toFixed(1)}x` : '1.0x'}
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={toggleZoom}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                    isZoomed
                      ? 'bg-[#199DD0] text-white shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {isZoomed ? 'Salir' : 'Zoom'}
                </button>
              </div>
            </div>

            {/* Contenedor Interactivo con Zoom */}
            <div
              ref={imageContainerRef}
              onClick={toggleZoom}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              className={`relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-inner select-none ${
                isZoomed ? 'cursor-move' : 'cursor-zoom-in'
              }`}
            >
              <img
                src={currentDisplayImage}
                alt={remera.title}
                decoding="async"
                style={
                  isZoomed
                    ? {
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        transform: `scale(${zoomLevel})`,
                        transition: 'transform 0.1s ease-out',
                      }
                    : {
                        transform: 'scale(1)',
                        transition: 'transform 0.25s ease-out',
                      }
                }
                className="w-full h-full object-cover pointer-events-none"
              />

              {/* Indicador de ayuda al pasar el mouse */}
              {!isZoomed && (
                <div className="absolute bottom-3 left-3 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-700/60 text-[11px] text-zinc-300 flex items-center gap-1.5 pointer-events-none shadow-md">
                  <Maximize2 className="w-3.5 h-3.5 text-[#199DD0]" />
                  <span>Hacé clic o tocá para hacer zoom en la estampa</span>
                </div>
              )}

              {isZoomed && (
                <div className="absolute bottom-3 left-3 bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#199DD0]/40 text-[11px] text-[#199DD0] flex items-center gap-1.5 pointer-events-none shadow-md">
                  <Move className="w-3.5 h-3.5" />
                  <span>Mové el mouse para explorar los detalles</span>
                </div>
              )}
            </div>
          </div>

          {/* Selector de variantes / miniaturas */}
          <div className="pt-4 space-y-2">
            <span className="text-[11px] font-semibold text-zinc-400 block">
              Variantes disponibles de la estampa:
            </span>
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
              {remera.colors.map((color) => {
                const isSelected = selectedColor === color;
                // Buscar si hay imagen específica para este color
                let thumbUrl = remera.image_url || '/images/hero-banner.jpg';
                if (remera.gallery_urls && remera.gallery_urls.length > 0) {
                  const cLower = color.toLowerCase();
                  const found = remera.gallery_urls.find((u) => {
                    const l = u.toLowerCase();
                    if (cLower.includes('blanco') && l.includes('blanca')) return true;
                    if (cLower.includes('negro') && l.includes('negra')) return true;
                    if (cLower.includes('amarillo') && l.includes('amarilla')) return true;
                    return false;
                  });
                  if (found) thumbUrl = found;
                }

                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setSelectedColor(color);
                      setIsZoomed(false);
                    }}
                    className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-[#FF00FF] bg-[#FF00FF]/15 text-white ring-1 ring-[#FF00FF] shadow-[0_0_15px_rgba(255,0,255,0.2)]'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <img
                      src={thumbUrl}
                      alt={color}
                      className="w-7 h-7 rounded-md object-cover border border-zinc-700"
                    />
                    <span>{color}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#FF00FF]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: FICHA DE PRODUCTO, TALLES Y COMPRA */}
        <div className="lg:w-2/5 p-6 flex flex-col justify-between space-y-5 bg-zinc-950">
          <div className="space-y-4">
            {/* Categoría y Colección */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-900 text-[#199DD0] border border-[#199DD0]/30">
                {remera.category}
              </span>

              {remera.collection_name && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeCollection && onViewCollection) {
                      onViewCollection(activeCollection);
                    }
                  }}
                  className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-[#FF00FF] transition-colors flex items-center gap-1"
                >
                  <span>Colección: {remera.collection_name}</span>
                  <Info className="w-3 h-3 text-[#FF00FF]" />
                </button>
              )}
            </div>

            {/* Título de la estampa */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
                {remera.title}
              </h2>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {formatCurrency(remera.price)}
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  por transferencia bancaria
                </span>
              </div>
            </div>

            {/* Descripción Cultural / Homenaje */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 leading-relaxed space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-[#FF00FF] tracking-wider block">
                Acerca de este diseño
              </span>
              <p>{remera.description}</p>
            </div>

            {/* Selector de Talle */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-zinc-300">Elegí tu Talle:</label>
                <span className="font-bold text-[#199DD0]">Talle {selectedSize}</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {remera.sizes.map((s) => {
                  const isSelected = selectedSize === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all text-center ${
                        isSelected
                          ? 'border-[#199DD0] bg-[#199DD0]/25 text-white ring-1 ring-[#199DD0] shadow-[0_0_10px_rgba(25,157,208,0.3)]'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Información de entrega */}
            <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
              <p className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Remera 100% algodón peinado de primera calidad.</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Estampa digital de alta durabilidad y definición.</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Envíos a todo el país o punto de retiro acordado.</span>
              </p>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="space-y-2.5 pt-4 border-t border-zinc-800">
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCheckout(remera, selectedColor, selectedSize);
                }}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#FF00FF] to-[#199DD0] hover:opacity-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,0,255,0.4)] transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Comprar ({formatCurrency(remera.price)})</span>
              </button>
            ) : (
              <a
                href="/login?redirect=/"
                className="w-full py-3.5 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold block text-center transition-colors"
              >
                Ingresá con tu usuario para comprar
              </a>
            )}

            {/* Consultar a Maris por WhatsApp */}
            <a
              href={buildWhatsAppLink(
                '5493435439216',
                `Hola Maris, estoy viendo en la tienda la remera '${remera.title}' (Talle ${selectedSize}, Color ${selectedColor}). Me gustaría consultarte por este modelo.`
              )}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800/80 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Consultar a Maris por WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
