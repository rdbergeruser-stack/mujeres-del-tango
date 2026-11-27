'use client';

import React, { useEffect, useState, useRef } from 'react';
import { SliderImage } from '@/types/database';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface HeroSliderProps {
  slides: SliderImage[];
  onSelectLinkedRemera?: (remeraTitle: string) => void;
}

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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-10">
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex flex-col items-center select-none"
      >
        {/* Escenario del Mazo Apilado a todo el ancho (1.91:1) */}
        <div
          style={{ aspectRatio: '1.91 / 1' }}
          className="relative w-full"
        >
          {/* Halo ambiental sutil */}
          <div className="absolute -inset-3 bg-gradient-to-r from-[#FF00FF]/15 via-[#9900CC]/10 to-[#199DD0]/15 blur-2xl rounded-[40px] pointer-events-none" />

          {activeSlides.map((slide, idx) => {
            const offset = (idx - currentIndex + total) % total;

            let transform = 'translate(0px, 24px) rotate(0deg) scale(0.92)';
            let opacity = 0;
            let zIndex = 0;
            let pointerEvents: 'auto' | 'none' = 'none';
            let borderClass = 'border border-zinc-800/60';

            if (offset === 0) {
              // Tarjeta principal al frente
              transform = 'translate(0px, 0px) rotate(0deg) scale(1)';
              opacity = 1;
              zIndex = 30;
              pointerEvents = 'auto';
              borderClass = 'border-2 border-[#199DD0]/70 hover:border-[#FF00FF]/80 shadow-[0_18px_45px_rgba(0,0,0,0.75)]';
            } else if (offset === 1) {
              // Segunda tarjeta asomando suavemente detrás
              transform = 'translate(-12px, 12px) rotate(-1.4deg) scale(0.975)';
              opacity = 0.72;
              zIndex = 20;
              borderClass = 'border border-zinc-700/70 shadow-2xl';
            } else if (offset === 2) {
              // Tercera tarjeta al fondo del mazo
              transform = 'translate(12px, 20px) rotate(1.6deg) scale(0.95)';
              opacity = 0.42;
              zIndex = 10;
              borderClass = 'border border-zinc-700/50 shadow-xl';
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
                }}
                className={`absolute inset-0 rounded-[28px] sm:rounded-[36px] overflow-hidden bg-zinc-950 transition-all duration-500 ease-out ${borderClass} ${
                  isTop ? 'cursor-pointer group' : ''
                }`}
              >
                <img
                  src={slide.image_url}
                  alt={slide.title || 'Mujeres del Tango'}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className={`w-full h-full object-cover transition-transform duration-700 ${
                    isTop ? 'group-hover:scale-[1.02]' : ''
                  }`}
                />

                {/* Degradado inferior para legibilidad */}
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

                {/* Contador arriba a la derecha */}
                {isTop && total > 1 && (
                  <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-20 px-2.5 py-1 rounded-full bg-zinc-950/75 backdrop-blur-md border border-white/15 text-[10px] sm:text-xs font-mono text-zinc-200">
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
            );
          })}
        </div>

        {/* Controles e indicadores debajo del mazo */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8 sm:mt-9">
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
