'use client';

import React, { useEffect, useState, useRef } from 'react';
import { SliderImage } from '@/types/database';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface HeroSliderProps {
  slides: SliderImage[];
  onSelectLinkedRemera?: (remeraTitle: string) => void;
}

// 3 siluetas orgánicas de papel de revista desgarrada (borde superior, derecho, inferior e izquierdo)
const TORN_POLYGONS = [
  'polygon(0.6% 1.4%, 5.2% 0.4%, 11.4% 1.8%, 17.8% 0.3%, 24.5% 1.5%, 31.2% 0.5%, 38.6% 1.7%, 45.1% 0.4%, 52.8% 1.6%, 59.4% 0.3%, 66.7% 1.5%, 73.5% 0.6%, 80.2% 1.8%, 87.4% 0.4%, 93.8% 1.4%, 99.3% 0.7%, 99.8% 9.5%, 99.0% 19.2%, 99.7% 29.8%, 98.9% 41.5%, 99.6% 53.0%, 99.1% 65.4%, 99.8% 77.2%, 99.0% 88.6%, 99.5% 98.4%, 94.1% 99.5%, 87.8% 98.1%, 81.2% 99.6%, 74.0% 98.4%, 67.3% 99.5%, 60.1% 98.2%, 53.4% 99.6%, 46.2% 98.3%, 39.0% 99.5%, 31.8% 98.2%, 24.9% 99.6%, 18.1% 98.4%, 11.2% 99.5%, 4.8% 98.3%, 0.5% 99.2%, 0.2% 89.4%, 1.0% 78.5%, 0.3% 66.8%, 1.1% 54.2%, 0.2% 42.6%, 0.9% 30.8%, 0.3% 19.5%, 1.0% 9.2%)',
  'polygon(0.8% 0.7%, 6.5% 1.8%, 13.2% 0.5%, 20.1% 1.7%, 27.4% 0.4%, 34.8% 1.6%, 41.9% 0.3%, 49.5% 1.8%, 56.8% 0.5%, 63.9% 1.6%, 71.2% 0.3%, 78.6% 1.5%, 85.4% 0.6%, 92.1% 1.8%, 99.2% 0.9%, 99.6% 12.0%, 98.9% 24.5%, 99.7% 36.2%, 99.0% 48.8%, 99.8% 61.4%, 98.9% 73.8%, 99.6% 86.2%, 99.2% 98.8%, 92.5% 98.2%, 85.8% 99.6%, 78.4% 98.3%, 71.5% 99.5%, 64.2% 98.1%, 56.9% 99.6%, 49.4% 98.4%, 42.1% 99.5%, 34.6% 98.2%, 27.3% 99.6%, 19.8% 98.4%, 12.6% 99.5%, 5.9% 98.2%, 0.6% 99.3%, 0.9% 87.5%, 0.2% 74.8%, 1.1% 62.1%, 0.3% 49.4%, 1.0% 36.8%, 0.2% 24.2%, 0.9% 11.8%)',
  'polygon(0.5% 1.6%, 7.4% 0.5%, 14.8% 1.5%, 21.9% 0.6%, 29.3% 1.8%, 36.7% 0.4%, 44.2% 1.5%, 51.6% 0.3%, 58.9% 1.7%, 66.2% 0.5%, 73.8% 1.6%, 81.1% 0.4%, 88.5% 1.7%, 95.2% 0.6%, 99.4% 1.4%, 99.0% 14.2%, 99.8% 27.6%, 99.1% 40.4%, 99.7% 53.8%, 98.9% 67.2%, 99.6% 80.6%, 99.1% 93.4%, 99.4% 99.1%, 91.8% 99.6%, 84.5% 98.2%, 77.2% 99.5%, 69.6% 98.3%, 62.3% 99.6%, 54.8% 98.1%, 47.2% 99.5%, 39.8% 98.4%, 32.4% 99.6%, 25.1% 98.2%, 17.6% 99.5%, 10.2% 98.3%, 3.4% 99.4%, 0.4% 98.5%, 1.1% 85.6%, 0.3% 71.8%, 1.0% 58.4%, 0.2% 44.6%, 1.1% 31.2%, 0.3% 17.8%, 0.9% 7.4%)',
];

// Inclinaciones alternadas (izquierda / derecha) para que cada foto tenga personalidad propia
const FRONT_TILTS = [-1.4, 1.5, -1.7, 1.3, -1.2, 1.6];

export default function HeroSlider({ slides, onSelectLinkedRemera }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const activeSlides = slides.filter((s) => s.is_active !== false);
  const total = activeSlides.length;

  useEffect(() => {
    if (currentIndex >= total && total > 0) {
      setCurrentIndex(0);
    }
  }, [total, currentIndex]);

  const goNext = () => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const goPrev = () => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5500);
    return () => clearInterval(timer);
  }, [total, isPaused]);

  if (total === 0) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) goNext();
        else goPrev();
      }
      touchStartX.current = null;
    }
    setIsPaused(false);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-9 sm:mt-12">
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex flex-col items-center select-none"
      >
        {/* Escenario del Mazo Apilado estilo Revista Desgarrada a todo el ancho (1.91:1) */}
        <div
          style={{ aspectRatio: '1.91 / 1' }}
          className="relative w-full"
        >
          {/* Halo ambiental sutil */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#FF00FF]/15 via-[#9900CC]/10 to-[#199DD0]/15 blur-2xl rounded-full pointer-events-none" />

          {activeSlides.map((slide, idx) => {
            const offset = (idx - currentIndex + total) % total;
            const frontTilt = FRONT_TILTS[idx % FRONT_TILTS.length];
            const outerClip = TORN_POLYGONS[idx % TORN_POLYGONS.length];
            const innerClip = TORN_POLYGONS[(idx + 1) % TORN_POLYGONS.length];

            let transform = 'translate(0px, 24px) rotate(0deg) scale(0.92)';
            let opacity = 0;
            let zIndex = 0;
            let pointerEvents: 'auto' | 'none' = 'none';
            let filterShadow = 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.7))';

            if (offset === 0) {
              // Tarjeta principal al frente con inclinación propia alternada (izq / der)
              transform = `translate(0px, 0px) rotate(${frontTilt}deg) scale(1)`;
              opacity = 1;
              zIndex = 30;
              pointerEvents = 'auto';
              filterShadow = 'drop-shadow(0 18px 34px rgba(0, 0, 0, 0.85))';
            } else if (offset === 1) {
              // Segunda tarjeta detrás inclinada en sentido contrario
              const backTilt = frontTilt > 0 ? -2.6 : 2.6;
              const shiftX = frontTilt > 0 ? -14 : 14;
              transform = `translate(${shiftX}px, 12px) rotate(${backTilt}deg) scale(0.97)`;
              opacity = 0.78;
              zIndex = 20;
            } else if (offset === 2) {
              // Tercera tarjeta al fondo del mazo
              const deepTilt = frontTilt > 0 ? 3.2 : -3.2;
              const shiftX = frontTilt > 0 ? 16 : -16;
              transform = `translate(${shiftX}px, 20px) rotate(${deepTilt}deg) scale(0.945)`;
              opacity = 0.45;
              zIndex = 10;
            }

            const isTop = offset === 0;

            return (
              <div
                key={slide.id}
                onClick={isTop ? goNext : undefined}
                style={{
                  transform,
                  opacity,
                  zIndex,
                  pointerEvents,
                  filter: filterShadow,
                }}
                className={`absolute inset-0 transition-all duration-500 ease-out ${
                  isTop ? 'cursor-pointer group' : ''
                }`}
              >
                {/* Capa exterior: borde blanco de papel de revista desgarrado */}
                <div
                  style={{ clipPath: outerClip }}
                  className="relative w-full h-full bg-[#f4f1ea] p-[5px] sm:p-[7px]"
                >
                  {/* Capa interior: foto recortada con borde irregular complementario */}
                  <div
                    style={{ clipPath: innerClip }}
                    className="relative w-full h-full overflow-hidden bg-zinc-950"
                  >
                    <img
                      src={slide.image_url}
                      alt={slide.title || 'Mujeres del Tango'}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      className={`w-full h-full object-cover transition-transform duration-700 ${
                        isTop ? 'group-hover:scale-[1.025]' : ''
                      }`}
                    />

                    {/* Degradado inferior para legibilidad */}
                    <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

                    {/* Contador arriba a la derecha */}
                    {isTop && total > 1 && (
                      <div className="absolute top-4 right-5 sm:top-6 sm:right-7 z-20 px-2.5 py-1 rounded-full bg-zinc-950/80 backdrop-blur-md border border-white/15 text-[10px] sm:text-xs font-mono text-zinc-200">
                        {currentIndex + 1} / {total}
                      </div>
                    )}

                    {/* Texto y botón "Ver esta remera" */}
                    {isTop && (slide.title || slide.subtitle || slide.linked_remera_title) && (
                      <div className="absolute inset-x-0 bottom-0 z-20 p-5 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                        <div className="max-w-2xl">
                          {slide.title && (
                            <h2 className="text-base sm:text-2xl lg:text-3xl font-bold text-white tracking-tight drop-shadow">
                              {slide.title}
                            </h2>
                          )}
                          {slide.subtitle && (
                            <p className="text-[11px] sm:text-sm text-zinc-200/90 mt-1 line-clamp-2 drop-shadow">
                              {slide.subtitle}
                            </p>
                          )}
                        </div>

                        {slide.linked_remera_title && onSelectLinkedRemera && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectLinkedRemera(slide.linked_remera_title!);
                            }}
                            className="self-start sm:self-auto px-4 py-2.5 rounded-full bg-gradient-to-r from-[#FF00FF] to-[#199DD0] hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,0,255,0.4)] transition-all shrink-0"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>Ver esta remera</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Controles e indicadores debajo del mazo */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-4 mt-9 sm:mt-11">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Foto anterior"
              className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 hover:border-[#199DD0] transition-all shadow-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              {activeSlides.map((slide, idx) => {
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Ir a foto ${idx + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      isCurrent
                        ? 'w-7 bg-gradient-to-r from-[#FF00FF] to-[#199DD0] shadow-[0_0_10px_rgba(255,0,255,0.5)]'
                        : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                    }`}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={goNext}
              aria-label="Foto siguiente"
              className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 hover:border-[#FF00FF] transition-all shadow-md"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
