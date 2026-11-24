import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { OFFICIAL_REMERAS, OFFICIAL_COLLECTIONS } from '@/lib/constants';

// GET /api/remeras - Obtiene todas las remeras oficiales y autosembra la BD si está vacía
export async function GET() {
  try {
    const adminClient = createAdminClient();

    // 1. Consultar remeras existentes
    const { data: dbRemeras, error: fetchError } = await (adminClient as any)
      .from('tango_remeras')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Si ya existen remeras en la base de datos con UUIDs reales, retornarlas
    if (!fetchError && dbRemeras && dbRemeras.length > 0) {
      return NextResponse.json({ remeras: dbRemeras });
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

    return NextResponse.json({
      remeras: seededRemeras && seededRemeras.length > 0 ? seededRemeras : OFFICIAL_REMERAS,
    });
  } catch (error: any) {
    console.error('Error en /api/remeras:', error);
    return NextResponse.json({ remeras: OFFICIAL_REMERAS });
  }
}
