import { NextResponse } from 'next/server';
import { getAllSlides } from '@/lib/slider-store';
import { DEFAULT_SLIDER_IMAGES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

// GET /api/slider - Devuelve las diapositivas activas ordenadas para el carrusel principal
export async function GET() {
  try {
    const { slides } = await getAllSlides();
    const activeSlides = slides.filter((s) => s.is_active !== false);
    return NextResponse.json({
      slides: activeSlides.length > 0 ? activeSlides : DEFAULT_SLIDER_IMAGES,
    });
  } catch (error) {
    console.error('Error en GET /api/slider:', error);
    return NextResponse.json({ slides: DEFAULT_SLIDER_IMAGES });
  }
}
