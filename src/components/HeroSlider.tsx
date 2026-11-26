'use client';

import React, { useEffect, useState, useRef } from 'react';
import { SliderImage } from '@/types/database';
import { ChevronLeft, ChevronRight, Sparkles, ZoomIn } from 'lucide-react';

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

  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5500);
    return () => clearInterval(timer);
  }, [total, isPaused]);

  if (total === 0) return null;

  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + total) % total);
  const goNext = () => setCurrentIndex((prev) => (prev + 1) % total);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  const currentSlide = activeSlides[currentIndex] || activeSlides[0];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative group rounded-2xl overflow-hidden border border-zinc-800/90 bg-zinc-950 shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
      >
        {/* Contenedor panorámico 1.91:1 */}
        <div
          style={{ aspectRatio: '1.91 / 1' }}
          className="relative w-full overflow-hidden bg-zinc-950"
        >
          {activeSlides.map((slide, idx) => {
            const isCurrent = idx === currentIndex;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={slide.image_url}
                  alt={slide.title || 'Mujeres del Tango'}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                {/* Degradado inferior sutil para legibilidad */}
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none" />
              </div>
            );
          })}

          {/* Etiqueta superior discreta */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950/75 backdrop-blur-md border border-white/15 text-[10px] sm:text-xs font-semibold text-zinc-200 shadow-sm">
              <Sparkles className="w-3 h-3 text-[#FF00FF]" />
              <span>Así quedan puestas</span>
            </span>
          </div>

          {/* Contador de fotos */}
          {total > 1 && (
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 px-2.5 py-1 rounded-full bg-zinc-950/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300">
              {currentIndex + 1} / {total}
            </div>
          )}

          {/* Texto y botón de acción sobre el degradado inferior */}
          {(currentSlide.title || currentSlide.subtitle || currentSlide.linked_remera_title) && (
            <div className="absolute inset-x-0 bottom-0 z-20 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="max-w-xl">
                {currentSlide.title && (
                  <h2 className="text-base sm:text-2xl font-bold text-white tracking-tight drop-shadow">
                    {currentSlide.title}
                  </h2>
                )}
                {currentSlide.subtitle && (
                  <p className="text-[11px] sm:text-sm text-zinc-200/90 mt-0.5 line-clamp-2 drop-shadow">
                    {currentSlide.subtitle}
                  </p>
                )}
              </div>

              {currentSlide.linked_remera_title && onSelectLinkedRemera && (
                <button
                  type="button"
                  onClick={() => onSelectLinkedRemera(currentSlide.linked_remera_title!)}
                  className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF00FF] to-[#199DD0] hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,0,255,0.4)] transition-all shrink-0"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Ver esta remera</span>
                </button>
              )}
            </div>
          )}

          {/* Flechas izquierda / derecha */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Foto anterior"
                className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-zinc-950/70 hover:bg-zinc-900 text-white border border-white/15 backdrop-blur-md opacity-85 sm:opacity-0 group-hover:opacity-100 transition-all shadow-lg"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={goNext}
                aria-label="Foto siguiente"
                className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-zinc-950/70 hover:bg-zinc-900 text-white border border-white/15 backdrop-blur-md opacity-85 sm:opacity-0 group-hover:opacity-100 transition-all shadow-lg"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </>
          )}
        </div>

        {/* Indicadores (puntitos) */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-2 py-2.5 bg-zinc-950/95 border-t border-zinc-800/80">
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
        )}
      </div>
    </section>
  );
}
