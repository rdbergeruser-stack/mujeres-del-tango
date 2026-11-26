import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  getAllSlides,
  createSlide,
  updateSlide,
  reorderSlides,
  deleteSlide,
  resetDefaultSlides,
} from '@/lib/slider-store';

async function checkAdmin() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    if (user.email?.toLowerCase().includes('maris') || user.email?.toLowerCase().includes('admin')) {
      return true;
    }

    const adminClient = createAdminClient();
    const { data: profile } = await (adminClient as any)
      .from('tango_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    return (profile as any)?.role === 'admin';
  } catch {
    return false;
  }
}

// GET /api/admin/slider - Lista todas las fotos del carrusel (activas y pausadas)
export async function GET() {
  try {
    const { slides } = await getAllSlides();
    return NextResponse.json({ slides });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al obtener el carrusel' }, { status: 500 });
  }
}

// POST /api/admin/slider - Subir nueva foto recortada (1.91:1) o restaurar las 6 de prueba
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const title = (formData.get('title') as string) || null;
      const subtitle = (formData.get('subtitle') as string) || null;
      const linked_remera_title = (formData.get('linked_remera_title') as string) || null;
      const is_active = formData.get('is_active') !== 'false';
      let image_url = (formData.get('image_url') as string) || '';

      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `slider/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await adminClient.storage
          .from('tango-remeras-images')
          .upload(fileName, buffer, {
            contentType: file.type || 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          return NextResponse.json(
            { error: `Error al subir la foto: ${uploadError.message}` },
            { status: 500 }
          );
        }

        const { data: publicUrlData } = adminClient.storage
          .from('tango-remeras-images')
          .getPublicUrl(fileName);
        image_url = publicUrlData.publicUrl;
      }

      if (!image_url) {
        return NextResponse.json({ error: 'Debés subir o indicar una imagen' }, { status: 400 });
      }

      const slide = await createSlide({
        title,
        subtitle,
        image_url,
        linked_remera_title,
        is_active,
      });

      return NextResponse.json({ slide }, { status: 201 });
    }

    const body = await req.json();
    if (body.action === 'reset') {
      const slides = await resetDefaultSlides();
      return NextResponse.json({
        success: true,
        message: 'Se restauraron las 6 fotos iniciales del carrusel.',
        slides,
      });
    }

    if (!body.image_url) {
      return NextResponse.json({ error: 'image_url es requerido' }, { status: 400 });
    }

    const slide = await createSlide(body);
    return NextResponse.json({ slide }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al guardar slide' }, { status: 500 });
  }
}

// PUT /api/admin/slider - Editar textos, estado, imagen recortada o reordenar
export async function PUT(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const id = formData.get('id') as string;
      if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

      const updateFields: any = {};
      if (formData.has('title')) updateFields.title = (formData.get('title') as string) || null;
      if (formData.has('subtitle')) updateFields.subtitle = (formData.get('subtitle') as string) || null;
      if (formData.has('linked_remera_title')) {
        updateFields.linked_remera_title = (formData.get('linked_remera_title') as string) || null;
      }
      if (formData.has('is_active')) updateFields.is_active = formData.get('is_active') === 'true';

      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `slider/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await adminClient.storage
          .from('tango-remeras-images')
          .upload(fileName, buffer, {
            contentType: file.type || 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          return NextResponse.json(
            { error: `Error al subir la imagen recortada: ${uploadError.message}` },
            { status: 500 }
          );
        }

        const { data: publicUrlData } = adminClient.storage
          .from('tango-remeras-images')
          .getPublicUrl(fileName);
        updateFields.image_url = publicUrlData.publicUrl;
      }

      const slide = await updateSlide(id, updateFields);
      return NextResponse.json({ slide });
    }

    const body = await req.json();

    if (Array.isArray(body.orderedIds)) {
      const slides = await reorderSlides(body.orderedIds);
      return NextResponse.json({ slides });
    }

    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const slide = await updateSlide(id, fields);
    return NextResponse.json({ slide });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar slide' }, { status: 500 });
  }
}

// DELETE /api/admin/slider?id=... - Eliminar slide del carrusel
export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    await deleteSlide(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al eliminar slide' }, { status: 500 });
  }
}
