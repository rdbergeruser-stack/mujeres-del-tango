import { createAdminClient } from '@/lib/supabase/admin';
import { DEFAULT_SLIDER_IMAGES } from '@/lib/constants';
import { SliderImage } from '@/types/database';

const BUCKET_NAME = 'tango-remeras-images';
const CONFIG_PATH = 'slider/slides-config.json';

function isMissingTableError(error: any): boolean {
  if (!error) return false;
  const msg = String(error.message || '').toLowerCase();
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('schema cache')
  );
}

async function readStorageSlides(adminClient: any): Promise<SliderImage[] | null> {
  try {
    const { data, error } = await adminClient.storage
      .from(BUCKET_NAME)
      .download(CONFIG_PATH);

    if (error || !data) return null;
    const text = await data.text();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }
    return null;
  } catch {
    return null;
  }
}

async function writeStorageSlides(adminClient: any, slides: SliderImage[]): Promise<boolean> {
  try {
    const sorted = [...slides].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const buffer = Buffer.from(JSON.stringify(sorted, null, 2), 'utf-8');
    const { error } = await adminClient.storage
      .from(BUCKET_NAME)
      .upload(CONFIG_PATH, buffer, {
        contentType: 'application/json',
        upsert: true,
        cacheControl: '0',
      });
    return !error;
  } catch {
    return false;
  }
}

export async function getAllSlides(): Promise<{ slides: SliderImage[]; backend: 'table' | 'storage' | 'default' }> {
  const adminClient = createAdminClient();

  const { data, error } = await (adminClient as any)
    .from('tango_slider_images')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (!error) {
    if (data && data.length > 0) {
      return { slides: data as SliderImage[], backend: 'table' };
    }
    // Sembrar las 6 fotos iniciales en la tabla si está vacía
    const rowsToInsert = DEFAULT_SLIDER_IMAGES.map((s, idx) => ({
      title: s.title,
      subtitle: s.subtitle,
      image_url: s.image_url,
      linked_remera_title: s.linked_remera_title,
      sort_order: idx,
      is_active: true,
    }));
    const { data: seeded } = await (adminClient as any)
      .from('tango_slider_images')
      .insert(rowsToInsert)
      .select();

    return {
      slides: seeded && seeded.length > 0 ? (seeded as SliderImage[]) : DEFAULT_SLIDER_IMAGES,
      backend: 'table',
    };
  }

  // Si la tabla todavía no fue creada en Supabase, usar archivo JSON en Supabase Storage
  if (isMissingTableError(error)) {
    const stored = await readStorageSlides(adminClient);
    if (stored && stored.length > 0) {
      return { slides: stored, backend: 'storage' };
    }
    await writeStorageSlides(adminClient, DEFAULT_SLIDER_IMAGES);
    return { slides: DEFAULT_SLIDER_IMAGES, backend: 'storage' };
  }

  return { slides: DEFAULT_SLIDER_IMAGES, backend: 'default' };
}

export async function createSlide(input: {
  title?: string | null;
  subtitle?: string | null;
  image_url: string;
  linked_remera_title?: string | null;
  is_active?: boolean;
}): Promise<SliderImage> {
  const adminClient = createAdminClient();
  const { slides, backend } = await getAllSlides();
  const nextOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.sort_order ?? 0)) + 1 : 0;

  if (backend === 'table') {
    const { data, error } = await (adminClient as any)
      .from('tango_slider_images')
      .insert({
        title: input.title || null,
        subtitle: input.subtitle || null,
        image_url: input.image_url,
        linked_remera_title: input.linked_remera_title || null,
        sort_order: nextOrder,
        is_active: input.is_active ?? true,
      })
      .select()
      .single();

    if (!error && data) return data as SliderImage;
  }

  const newSlide: SliderImage = {
    id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: input.title || null,
    subtitle: input.subtitle || null,
    image_url: input.image_url,
    linked_remera_title: input.linked_remera_title || null,
    sort_order: nextOrder,
    is_active: input.is_active ?? true,
    created_at: new Date().toISOString(),
  };

  await writeStorageSlides(adminClient, [...slides, newSlide]);
  return newSlide;
}

export async function updateSlide(
  id: string,
  fields: Partial<Pick<SliderImage, 'title' | 'subtitle' | 'image_url' | 'linked_remera_title' | 'sort_order' | 'is_active'>>
): Promise<SliderImage | null> {
  const adminClient = createAdminClient();
  const { slides, backend } = await getAllSlides();

  if (backend === 'table') {
    const { data, error } = await (adminClient as any)
      .from('tango_slider_images')
      .update(fields)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) return data as SliderImage;
  }

  let updatedItem: SliderImage | null = null;
  const nextSlides = slides.map((s) => {
    if (s.id === id) {
      updatedItem = { ...s, ...fields };
      return updatedItem;
    }
    return s;
  });

  if (updatedItem) {
    await writeStorageSlides(adminClient, nextSlides);
  }
  return updatedItem;
}

export async function reorderSlides(orderedIds: string[]): Promise<SliderImage[]> {
  const adminClient = createAdminClient();
  const { slides, backend } = await getAllSlides();

  const orderMap = new Map<string, number>();
  orderedIds.forEach((id, idx) => orderMap.set(id, idx));

  if (backend === 'table') {
    await Promise.all(
      orderedIds.map((id, idx) =>
        (adminClient as any)
          .from('tango_slider_images')
          .update({ sort_order: idx })
          .eq('id', id)
      )
    );
    const refreshed = await getAllSlides();
    return refreshed.slides;
  }

  const nextSlides = slides
    .map((s) => ({
      ...s,
      sort_order: orderMap.has(s.id) ? orderMap.get(s.id)! : s.sort_order,
    }))
    .sort((a, b) => a.sort_order - b.sort_order);

  await writeStorageSlides(adminClient, nextSlides);
  return nextSlides;
}

export async function deleteSlide(id: string): Promise<boolean> {
  const adminClient = createAdminClient();
  const { slides, backend } = await getAllSlides();

  if (backend === 'table') {
    const { error } = await (adminClient as any)
      .from('tango_slider_images')
      .delete()
      .eq('id', id);
    if (!error) return true;
  }

  const nextSlides = slides.filter((s) => s.id !== id);
  return writeStorageSlides(adminClient, nextSlides);
}

export async function resetDefaultSlides(): Promise<SliderImage[]> {
  const adminClient = createAdminClient();
  const { backend } = await getAllSlides();

  if (backend === 'table') {
    await (adminClient as any).from('tango_slider_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const rowsToInsert = DEFAULT_SLIDER_IMAGES.map((s, idx) => ({
      title: s.title,
      subtitle: s.subtitle,
      image_url: s.image_url,
      linked_remera_title: s.linked_remera_title,
      sort_order: idx,
      is_active: true,
    }));
    const { data } = await (adminClient as any)
      .from('tango_slider_images')
      .insert(rowsToInsert)
      .select();
    return (data as SliderImage[]) || DEFAULT_SLIDER_IMAGES;
  }

  await writeStorageSlides(adminClient, DEFAULT_SLIDER_IMAGES);
  return DEFAULT_SLIDER_IMAGES;
}
