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
  const [animatingDir, setAnimatingDir] = useState<'next' | 'prev' | null>(null);
  const touchStartX = useRef<number | null>(null);

  const activeSlides = slides.filter((s) => s.is_active !== false);
  const total = activeSlides.length;

  useEffect(() => {
    if (currentIndex >= total && total > 0) {
      setCurrentIndex(0);
    }
  }, [total, currentIndex]);

  const triggerStep = (dir: 'next' | 'prev') => {
    if (total <= 1 || animatingDir) return;
    setAnimatingDir(dir);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        dir === 'next' ? (prev + 1) % total : (prev - 1 + total) % total
      );
      setAnimatingDir(null);
    }, 260);
  };

  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const timer = setInterval(() => {
      triggerStep('next');
    }, 5500);
    return () => clearInterval(timer);
  }, [total, isPaused, animatingDir]);

  if (total === 0) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) triggerStep('next');
        else triggerStep('prev');
      }
      touchStartX.current = null;
    }
    setIsPaused(false);
  };

  // Las 3 tarjetas visibles del mazo (superior + 2 detrás)
  const topSlide = activeSlides[currentIndex] || activeSlides[0];
  const secondSlide = total > 1 ? activeSlides[(currentIndex + 1) % total] : null;
  const thirdSlide = total > 2 ? activeSlides[(currentIndex + 2) % total] : null;

  const topTransform =
    animatingDir === 'next'
      ? 'translateX(-14%) rotate(-5deg) scale(0.96)'
      : animatingDir === 'prev'
        ? 'translateX(14%) rotate(5deg) scale(0.96)'
        : 'translateX(0) rotate(0deg) scale(1)';

  return (
    <section className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-10 mt-8 sm:mt-10">
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex flex-col items-center select-none"
      >
        {/* Escenario del Mazo Apilado (1.91:1) */}
        <div
          style={{ aspectRatio: '1.91 / 1' }}
          className="relative w-full max-w-4xl"
        >
          {/* Halo ambiental sutil */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#FF00FF]/15 via-[#9900CC]/10 to-[#199DD0]/15 blur-2xl rounded-[40px] pointer-events-none" />

          {/* Tarjeta 3 (fondo del mazo) */}
          {thirdSlide && (
            <div
              className="absolute inset-0 rounded-[26px] sm:rounded-[34px] overflow-hidden border border-zinc-700/50 bg-zinc-950 shadow-xl transition-all duration-500 pointer-events-none"
              style={{
                transform: animatingDir
                  ? 'translate(-10px, 8px) rotate(-2deg) scale(0.96)'
                  : 'translate(16px, 14px) rotate(3deg) scale(0.93)',
                opacity: animatingDir ? 0.65 : 0.4,
              }}
            >
              <img
                src={thirdSlide.image_url}
                alt={thirdSlide.title || 'Mujeres del Tango'}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Tarjeta 2 (siguiente en el mazo) */}
          {secondSlide && (
            <div
              className="absolute inset-0 rounded-[26px] sm:rounded-[34px] overflow-hidden border border-zinc-700/70 bg-zinc-950 shadow-2xl transition-all duration-500 pointer-events-none"
              style={{
                transform: animatingDir
                  ? 'translate(0px, 0px) rotate(0deg) scale(1)'
                  : 'translate(-14px, 8px) rotate(-2.2deg) scale(0.965)',
                opacity: animatingDir ? 1 : 0.72,
              }}
            >
              <img
                src={secondSlide.image_url}
                alt={secondSlide.title || 'Mujeres del Tango'}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Tarjeta 1 (arriba, protagonista e interactiva) */}
          <div
            onClick={() => triggerStep('next')}
            style={{
              transform: topTransform,
              opacity: animatingDir ? 0 : 1,
            }}
            className="absolute inset-0 z-20 rounded-[28px] sm:rounded-[36px] overflow-hidden border-2 border-[#199DD0]/70 hover:border-[#FF00FF]/80 bg-zinc-950 shadow-[0_18px_45px_rgba(0,0,0,0.75)] transition-all duration-300 ease-out cursor-pointer group"
          >
            <img
              src={topSlide.image_url}
              alt={topSlide.title || 'Mujeres del Tango'}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />

            {/* Degradado inferior para legibilidad */}
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

            {/* Contador arriba a la derecha */}
            {total > 1 && (
              <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-20 px-2.5 py-1 rounded-full bg-zinc-950/75 backdrop-blur-md border border-white/15 text-[10px] sm:text-xs font-mono text-zinc-200">
                {currentIndex + 1} / {total}
              </div>
            )}

            {/* Texto y botón "Ver esta remera" */}
            {(topSlide.title || topSlide.subtitle || topSlide.linked_remera_title) && (
              <div className="absolute inset-x-0 bottom-0 z-20 p-5 sm:p-7 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div className="max-w-xl">
                  {topSlide.title && (
                    <h2 className="text-base sm:text-2xl font-bold text-white tracking-tight drop-shadow">
                      {topSlide.title}
                    </h2>
                  )}
                  {topSlide.subtitle && (
                    <p className="text-[11px] sm:text-sm text-zinc-200/90 mt-0.5 line-clamp-2 drop-shadow">
                      {topSlide.subtitle}
                    </p>
                  )}
                </div>

                {topSlide.linked_remera_title && onSelectLinkedRemera && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLinkedRemera(topSlide.linked_remera_title!);
                    }}
                    className="self-start sm:self-auto px-3.5 py-2 rounded-full bg-gradient-to-r from-[#FF00FF] to-[#199DD0] hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,0,255,0.4)] transition-all shrink-0"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Ver esta remera</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Controles e indicadores debajo del mazo */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-4 mt-7 sm:mt-8">
            <button
              type="button"
              onClick={() => triggerStep('prev')}
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
              onClick={() => triggerStep('next')}
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
