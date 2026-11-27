'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { SliderImage } from '@/types/database';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface HeroSliderProps {
  slides: SliderImage[];
  onSelectLinkedRemera?: (remeraTitle: string) => void;
}

// Generador determinístico de ruido pseudoaleatorio (evita errores de hidratación SSR/CSR)
function seededRand(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Genera una silueta fractal multi-escala de papel de revista desgarrado a mano
// Combina ondas amplias, muescas profundas aleatorias y micro-fibras irregulares (~240 puntos)
function buildRealisticTornPolygon(
  seed: number,
  baseInsetX: number,
  baseInsetY: number,
  roughnessX: number,
  roughnessY: number
): string {
  const rand = seededRand(seed);

  // Generar una secuencia de offsets irregulares (ondas + muescas + micro-fibra)
  const makeEdgeOffsets = (steps: number, amp: number) => {
    // Puntos de control de baja frecuencia (forma general del desgarro)
    const coarseCount = 7;
    const coarse = Array.from({ length: coarseCount + 1 }, () => (rand() - 0.5) * amp * 1.15);

    // 1 o 2 muescas más profundas al azar como cuando se traba el papel al rasgar
    const notch1Pos = 0.15 + rand() * 0.3;
    const notch2Pos = 0.55 + rand() * 0.3;
    const notch1Depth = amp * (0.6 + rand() * 0.85);
    const notch2Depth = amp * (0.5 + rand() * 0.75);

    const out: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Interpolación lineal suave de la onda gruesa
      const pos = t * coarseCount;
      const idx = Math.min(coarseCount - 1, Math.floor(pos));
      const frac = pos - idx;
      const wave = coarse[idx] * (1 - frac) + coarse[idx + 1] * frac;

      // Muescas orgánicas localizadas
      const d1 = Math.abs(t - notch1Pos);
      const d2 = Math.abs(t - notch2Pos);
      const notch =
        (d1 < 0.035 ? (1 - d1 / 0.035) * notch1Depth : 0) +
        (d2 < 0.03 ? (1 - d2 / 0.03) * notch2Depth : 0);

      // Micro-fibra irregular (alta frecuencia)
      const fiber = (rand() - 0.5) * amp * 0.65;

      out.push(Math.max(0, wave + notch + fiber + amp * 0.55));
    }
    return out;
  };

  const stepsH = 72; // 72 puntos en borde superior e inferior
  const stepsV = 42; // 42 puntos en borde izquierdo y derecho

  const topOff = makeEdgeOffsets(stepsH, roughnessY);
  const rightOff = makeEdgeOffsets(stepsV, roughnessX);
  const bottomOff = makeEdgeOffsets(stepsH, roughnessY);
  const leftOff = makeEdgeOffsets(stepsV, roughnessX);

  const pts: string[] = [];

  // Borde superior (izq -> der)
  for (let i = 0; i <= stepsH; i++) {
    const x = baseInsetX + (i / stepsH) * (100 - baseInsetX * 2);
    const y = baseInsetY + topOff[i];
    pts.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
  }
  // Borde derecho (arriba -> abajo)
  for (let i = 1; i <= stepsV; i++) {
    const x = 100 - baseInsetX - rightOff[i];
    const y = baseInsetY + (i / stepsV) * (100 - baseInsetY * 2);
    pts.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
  }
  // Borde inferior (der -> izq)
  for (let i = 1; i <= stepsH; i++) {
    const x = 100 - baseInsetX - (i / stepsH) * (100 - baseInsetX * 2);
    const y = 100 - baseInsetY - bottomOff[i];
    pts.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
  }
  // Borde izquierdo (abajo -> arriba)
  for (let i = 1; i < stepsV; i++) {
    const x = baseInsetX + leftOff[i];
    const y = 100 - baseInsetY - (i / stepsV) * (100 - baseInsetY * 2);
    pts.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
  }

  return `polygon(${pts.join(', ')})`;
}

// Inclinaciones alternadas (izquierda / derecha) para que cada foto tenga personalidad propia
const FRONT_TILTS = [-1.4, 1.5, -1.7, 1.3, -1.2, 1.6];

export default function HeroSlider({ slides, onSelectLinkedRemera }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const activeSlides = slides.filter((s) => s.is_active !== false);
  const total = activeSlides.length;

  // Precalcular siluetas únicas de papel desgarrado (borde blanco exterior + foto interior asimétrica)
  const tearClips = useMemo(() => {
    return activeSlides.map((_, idx) => ({
      // Papel blanco exterior (fibra rasgada más amplia)
      outerPaper: buildRealisticTornPolygon(101 + idx * 37, 0.2, 0.3, 1.15, 1.85),
      // Capa intermedia ligeramente grisácea (sombra de fibra del papel)
      midFiber: buildRealisticTornPolygon(211 + idx * 53, 0.65, 1.0, 1.25, 2.0),
      // Foto impresa interior (desgarro independiente para que el borde blanco varíe de grosor!)
      innerPhoto: buildRealisticTornPolygon(307 + idx * 71, 1.1, 1.75, 1.35, 2.15),
    }));
  }, [total]);

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
            const clips = tearClips[idx] || tearClips[0];

            let transform = 'translate(0px, 24px) rotate(0deg) scale(0.92)';
            let opacity = 0;
            let zIndex = 0;
            let pointerEvents: 'auto' | 'none' = 'none';
            let filterShadow = 'drop-shadow(0 12px 22px rgba(0, 0, 0, 0.72))';

            if (offset === 0) {
              // Tarjeta principal al frente con inclinación propia alternada (izq / der)
              transform = `translate(0px, 0px) rotate(${frontTilt}deg) scale(1)`;
              opacity = 1;
              zIndex = 30;
              pointerEvents = 'auto';
              filterShadow = 'drop-shadow(0 20px 36px rgba(0, 0, 0, 0.88))';
            } else if (offset === 1) {
              // Segunda tarjeta detrás inclinada en sentido contrario
              const backTilt = frontTilt > 0 ? -2.6 : 2.6;
              const shiftX = frontTilt > 0 ? -14 : 14;
              transform = `translate(${shiftX}px, 12px) rotate(${backTilt}deg) scale(0.97)`;
              opacity = 0.8;
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
                {/* Capa 1: Papel blanco exterior desgarrado con textura de papel */}
                <div
                  style={{
                    clipPath: clips.outerPaper,
                    backgroundImage:
                      'radial-gradient(rgba(0,0,0,0.06) 1px, transparent 0), linear-gradient(135deg, #f7f4ec 0%, #ebe5d8 50%, #f4f0e6 100%)',
                    backgroundSize: '6px 6px, 100% 100%',
                  }}
                  className="relative w-full h-full"
                >
                  {/* Capa 2: Fibra interna de papel más oscura (da profundidad real al rasgado) */}
                  <div
                    style={{ clipPath: clips.midFiber }}
                    className="absolute inset-0 bg-[#dcd5c7]/90"
                  />

                  {/* Capa 3: Foto impresa con desgarro asimétrico independiente */}
                  <div
                    style={{ clipPath: clips.innerPhoto }}
                    className="absolute inset-0 overflow-hidden bg-zinc-950"
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
                      <div className="absolute top-5 right-6 sm:top-7 sm:right-8 z-20 px-2.5 py-1 rounded-full bg-zinc-950/80 backdrop-blur-md border border-white/15 text-[10px] sm:text-xs font-mono text-zinc-200">
                        {currentIndex + 1} / {total}
                      </div>
                    )}

                    {/* Texto y botón "Ver esta remera" */}
                    {isTop && (slide.title || slide.subtitle || slide.linked_remera_title) && (
                      <div className="absolute inset-x-0 bottom-0 z-20 p-6 sm:p-9 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
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
