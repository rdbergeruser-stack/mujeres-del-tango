import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { OFFICIAL_REMERAS, OFFICIAL_COLLECTIONS } from '@/lib/constants';

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

function cleanDuplicateRemeras(adminClient: any, list: any[]): any[] {
  if (!list || !Array.isArray(list)) return [];
  const byTitle = new Map<string, any[]>();
  for (const item of list) {
    const key = item.title.trim().toLowerCase();
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key)!.push(item);
  }

  const cleanList: any[] = [];
  const cleanupTasks: Promise<any>[] = [];

  for (const [key, group] of byTitle.entries()) {
    if (group.length === 1) {
      cleanList.push(group[0]);
    } else {
      // Ordenar: conservar el que tenga menor stock (tuvo compras) o más antiguo
      group.sort((a, b) => Number(a.stock) - Number(b.stock));
      const toKeep = group[0];
      cleanList.push(toKeep);

      // Eliminar los duplicados restantes de la base de datos en segundo plano
      for (let i = 1; i < group.length; i++) {
        const dup = group[i];
        cleanupTasks.push(
          (async () => {
            try {
              await adminClient
                .from('tango_orders')
                .update({ remera_id: toKeep.id })
                .eq('remera_id', dup.id);

              await adminClient
                .from('tango_remeras')
                .delete()
                .eq('id', dup.id);
            } catch (delErr) {
              console.error('Error al depurar duplicado en BD:', dup.id, delErr);
            }
          })()
        );
      }
    }
  }

  if (cleanupTasks.length > 0) {
    Promise.allSettled(cleanupTasks).catch(() => {});
  }

  return cleanList;
}

// GET /api/admin/remeras - Listar todas las remeras (con depuración automática de duplicados)
export async function GET() {
  try {
    const adminClient = createAdminClient();

    // 1. Consultar remeras existentes en la BD
    const { data: remeras, error } = await adminClient
      .from('tango_remeras')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && remeras && remeras.length > 0) {
      const cleanRemeras = cleanDuplicateRemeras(adminClient, remeras);
      return NextResponse.json({ remeras: cleanRemeras });
    }

    // 2. Si la tabla está vacía o hubo error de tabla inexistente, sembrar las oficiales
    console.log('Sembrando catálogo de remeras y colecciones en Supabase...');

    for (const coll of OFFICIAL_COLLECTIONS) {
      await (adminClient as any)
        .from('tango_collections')
        .upsert(
          {
            name: coll.name,
            bio: coll.bio,
            instagram: coll.instagram,
            avatar_url: coll.avatar_url,
          },
          { onConflict: 'name' }
        );
    }

    for (const rem of OFFICIAL_REMERAS) {
      const { data: existing } = await (adminClient as any)
        .from('tango_remeras')
        .select('id')
        .eq('title', rem.title)
        .maybeSingle();

      if (!existing) {
        await (adminClient as any)
          .from('tango_remeras')
          .insert({
            title: rem.title,
            description: rem.description,
            price: rem.price,
            category: rem.category,
            collection_name: rem.collection_name,
            sizes: rem.sizes,
            colors: rem.colors,
            stock: rem.stock,
            image_url: rem.image_url,
            gallery_urls: rem.gallery_urls,
            is_active: true,
          });
      }
    }

    // Volver a consultar con los UUIDs reales recién generados y depurar duplicados
    const { data: seededRemeras } = await adminClient
      .from('tango_remeras')
      .select('*')
      .order('created_at', { ascending: false });

    const cleanSeeded = cleanDuplicateRemeras(adminClient, seededRemeras || []);

    return NextResponse.json({
      remeras: cleanSeeded && cleanSeeded.length > 0 ? cleanSeeded : OFFICIAL_REMERAS,
    });
  } catch (error: any) {
    console.error('Error al obtener o sembrar remeras:', error);
    return NextResponse.json({ remeras: OFFICIAL_REMERAS });
  }
}

// POST /api/admin/remeras - Crear nueva remera o sincronizar catálogo oficial
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const contentType = req.headers.get('content-type') || '';

    // Manejo de petición JSON (incluyendo acción de sincronización)
    if (!contentType.includes('multipart/form-data')) {
      const body = await req.json();

      // Acción de sincronización / sembrado forzado
      if (body.action === 'seed' || body.action === 'sync') {
        for (const coll of OFFICIAL_COLLECTIONS) {
          await (adminClient as any)
            .from('tango_collections')
            .upsert(
              {
                name: coll.name,
                bio: coll.bio,
                instagram: coll.instagram,
                avatar_url: coll.avatar_url,
              },
              { onConflict: 'name' }
            );
        }

        let insertedCount = 0;
        for (const rem of OFFICIAL_REMERAS) {
          const { data: existing } = await (adminClient as any)
            .from('tango_remeras')
            .select('id')
            .eq('title', rem.title)
            .maybeSingle();

          if (!existing) {
            await (adminClient as any)
              .from('tango_remeras')
              .insert({
                title: rem.title,
                description: rem.description,
                price: rem.price,
                category: rem.category,
                collection_name: rem.collection_name,
                sizes: rem.sizes,
                colors: rem.colors,
                stock: rem.stock,
                image_url: rem.image_url,
                gallery_urls: rem.gallery_urls,
                is_active: true,
              });
            insertedCount++;
          }
        }

        const { data: allRemeras } = await adminClient
          .from('tango_remeras')
          .select('*')
          .order('created_at', { ascending: false });

        const cleanRemeras = await cleanDuplicateRemeras(adminClient, allRemeras || []);

        return NextResponse.json({
          success: true,
          message: `Sincronización completada. Catálogo limpio sin duplicados.`,
          remeras: cleanRemeras && cleanRemeras.length > 0 ? cleanRemeras : OFFICIAL_REMERAS,
        });
      }

      // Inserción manual por JSON
      const { data: newRemera, error: insertError } = await (adminClient as any)
        .from('tango_remeras')
        .insert(body)
        .select()
        .single();

      if (insertError) throw insertError;
      return NextResponse.json({ remera: newRemera }, { status: 201 });
    }

    // Inserción multipart/form-data (con subida de imagen)
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
        .from('tango-remeras-images')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        console.error('Error al subir imagen a Supabase Storage:', uploadError);
      } else {
        const { data: publicUrlData } = adminClient.storage
          .from('tango-remeras-images')
          .getPublicUrl(fileName);
        image_url = publicUrlData.publicUrl;
      }
    }

    const { data: newRemera, error: insertError } = await (adminClient as any)
      .from('tango_remeras')
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
          .from('tango-remeras-images')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = adminClient.storage
            .from('tango-remeras-images')
            .getPublicUrl(fileName);
          updateData.image_url = publicUrlData.publicUrl;
        }
      } else if (formData.has('image_url') && formData.get('image_url')) {
        updateData.image_url = formData.get('image_url') as string;
      }

      const { data: updated, error: updateError } = await (adminClient as any)
        .from('tango_remeras')
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
        .from('tango_remeras')
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
    const { error } = await adminClient.from('tango_remeras').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al eliminar remera' }, { status: 500 });
  }
}
