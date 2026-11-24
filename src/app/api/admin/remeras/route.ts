import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return (profile as any)?.role === 'admin' || user.email?.toLowerCase().includes('maris');
}

// GET /api/admin/remeras - Listar todas las remeras (incluyendo inactivas)
export async function GET() {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: remeras, error } = await adminClient
      .from('remeras')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ remeras });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al obtener remeras' }, { status: 500 });
  }
}

// POST /api/admin/remeras - Crear nueva remera o subir imagen
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
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const price = parseFloat(formData.get('price') as string);
      const category = (formData.get('category') as string) || 'Corte Clásico';
      const collection_name = (formData.get('collection_name') as string) || null;
      const stock = parseInt(formData.get('stock') as string, 10) || 10;
      const is_active = formData.get('is_active') === 'true';

      const sizesRaw = formData.get('sizes') as string;
      const sizes = sizesRaw ? JSON.parse(sizesRaw) : ['S', 'M', 'L', 'XL'];

      const colorsRaw = formData.get('colors') as string;
      const colors = colorsRaw ? JSON.parse(colorsRaw) : ['Negro', 'Blanco Crudo'];

      let image_url = (formData.get('image_url') as string) || '';

      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await adminClient.storage
          .from('remeras-images')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (uploadError) {
          console.error('Error al subir imagen a Supabase Storage:', uploadError);
        } else {
          const { data: publicUrlData } = adminClient.storage
            .from('remeras-images')
            .getPublicUrl(fileName);
          image_url = publicUrlData.publicUrl;
        }
      }

      const { data: newRemera, error: insertError } = await (adminClient as any)
        .from('remeras')
        .insert({
          title,
          description,
          price,
          category,
          collection_name,
          sizes,
          colors,
          stock,
          image_url: image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
          gallery_urls: [],
          is_active,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return NextResponse.json({ remera: newRemera }, { status: 201 });
    } else {
      const body = await req.json();
      const { data: newRemera, error: insertError } = await (adminClient as any)
        .from('remeras')
        .insert(body)
        .select()
        .single();

      if (insertError) throw insertError;
      return NextResponse.json({ remera: newRemera }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al guardar remera' }, { status: 500 });
  }
}

// PUT /api/admin/remeras - Editar remera existente
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

      const updateData: any = {};
      if (formData.has('title')) updateData.title = formData.get('title') as string;
      if (formData.has('description')) updateData.description = formData.get('description') as string;
      if (formData.has('price')) updateData.price = parseFloat(formData.get('price') as string);
      if (formData.has('category')) updateData.category = formData.get('category') as string;
      if (formData.has('collection_name')) updateData.collection_name = (formData.get('collection_name') as string) || null;
      if (formData.has('stock')) updateData.stock = parseInt(formData.get('stock') as string, 10);
      if (formData.has('is_active')) updateData.is_active = formData.get('is_active') === 'true';

      if (formData.has('sizes')) {
        updateData.sizes = JSON.parse(formData.get('sizes') as string);
      }
      if (formData.has('colors')) {
        updateData.colors = JSON.parse(formData.get('colors') as string);
      }

      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await adminClient.storage
          .from('remeras-images')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = adminClient.storage
            .from('remeras-images')
            .getPublicUrl(fileName);
          updateData.image_url = publicUrlData.publicUrl;
        }
      } else if (formData.has('image_url') && formData.get('image_url')) {
        updateData.image_url = formData.get('image_url') as string;
      }

      const { data: updated, error: updateError } = await (adminClient as any)
        .from('remeras')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return NextResponse.json({ remera: updated });
    } else {
      const body = await req.json();
      const { id, ...updateFields } = body;
      if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

      const { data: updated, error: updateError } = await (adminClient as any)
        .from('remeras')
        .update(updateFields)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return NextResponse.json({ remera: updated });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar remera' }, { status: 500 });
  }
}

// DELETE /api/admin/remeras - Eliminar remera
export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const adminClient = createAdminClient();
    const { error } = await adminClient.from('remeras').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al eliminar remera' }, { status: 500 });
  }
}
