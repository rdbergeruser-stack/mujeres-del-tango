import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { OFFICIAL_REMERAS, OFFICIAL_COLLECTIONS } from '@/lib/constants';

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

// GET /api/remeras - Obtiene todas las remeras oficiales y depura duplicados
export async function GET() {
  try {
    const adminClient = createAdminClient();

    // 1. Consultar remeras existentes
    const { data: dbRemeras, error: fetchError } = await (adminClient as any)
      .from('tango_remeras')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Si ya existen remeras en la base de datos con UUIDs reales, depurar duplicados y retornarlas
    if (!fetchError && dbRemeras && dbRemeras.length > 0) {
      const cleanList = cleanDuplicateRemeras(adminClient, dbRemeras);
      return NextResponse.json({ remeras: cleanList });
    }

    // 2. Si no hay remeras o la tabla está vacía, sembrar automáticamente las colecciones y remeras
    console.log('Sembrando colecciones y remeras oficiales automáticamente...');

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

    // Volver a consultar las remeras recién insertadas con sus UUIDs
    const { data: seededRemeras } = await (adminClient as any)
      .from('tango_remeras')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const cleanSeeded = cleanDuplicateRemeras(adminClient, seededRemeras || []);

    return NextResponse.json({
      remeras: cleanSeeded && cleanSeeded.length > 0 ? cleanSeeded : OFFICIAL_REMERAS,
    });
  } catch (error: any) {
    console.error('Error en /api/remeras:', error);
    return NextResponse.json({ remeras: OFFICIAL_REMERAS });
  }
}
