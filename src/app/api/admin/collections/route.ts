import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { OFFICIAL_COLLECTIONS } from '@/lib/constants';

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

// GET /api/admin/collections - Obtener colecciones (con autosembrado inteligente si está vacía)
export async function GET() {
  try {
    const adminClient = createAdminClient();
    const { data: collections, error } = await adminClient
      .from('tango_collections')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && collections && collections.length > 0) {
      return NextResponse.json({ collections });
    }

    // Auto-sembrar colecciones si la tabla está vacía
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

    const { data: seeded } = await adminClient
      .from('tango_collections')
      .select('*')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      collections: seeded && seeded.length > 0 ? seeded : OFFICIAL_COLLECTIONS,
    });
  } catch (error: any) {
    console.error('Error al obtener o sembrar colecciones:', error);
    return NextResponse.json({ collections: OFFICIAL_COLLECTIONS });
  }
}

// POST /api/admin/collections - Crear colección
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const body = await req.json();
    const { name, bio, instagram, avatar_url } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre de la colección es obligatorio' }, { status: 400 });
    }

    const { data: collection, error } = await (adminClient as any)
      .from('tango_collections')
      .insert({
        name: name.trim(),
        bio: bio || null,
        instagram: instagram || null,
        avatar_url: avatar_url || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ collection }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al crear colección' }, { status: 500 });
  }
}

// DELETE /api/admin/collections - Borrar colección
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
    const { error } = await adminClient.from('tango_collections').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al eliminar colección' }, { status: 500 });
  }
}
