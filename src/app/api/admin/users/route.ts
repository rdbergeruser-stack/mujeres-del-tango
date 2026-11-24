import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { buildWhatsAppLink, usernameToInternalEmail, extractUsername, formatDetailedAddress } from '@/lib/utils';

async function checkAdmin() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Fast-path: comprobación instantánea sin query adicional
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

// GET /api/admin/users - Listado de clientes de Mujeres del Tango
export async function GET() {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: profiles, error } = await adminClient
      .from('tango_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ profiles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al listar clientes' }, { status: 500 });
  }
}

// POST /api/admin/users - Creación asistida de clientes por Maris
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const body = await req.json();
    let { full_name, username, phone, address, detailed_address, temp_password = '123456' } = body;

    if (!full_name || !full_name.trim()) {
      return NextResponse.json({ error: 'El nombre completo es requerido' }, { status: 400 });
    }

    if (detailed_address && !address) {
      address = formatDetailedAddress(detailed_address);
    }

    let cleanUsername = username?.trim().toLowerCase();
    if (!cleanUsername) {
      cleanUsername = full_name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '.');
    } else {
      cleanUsername = cleanUsername.replace(/[^a-z0-9._-]/g, '');
    }

    const internalEmail = usernameToInternalEmail(cleanUsername);

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: internalEmail,
      password: temp_password,
      email_confirm: true,
      user_metadata: {
        app: 'mujeres_del_tango',
        username: cleanUsername,
        full_name,
        phone,
        address,
        role: 'user',
        must_change_password: true,
      },
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: `El usuario "${cleanUsername}" ya está registrado. Elegí una variante (ej: ${cleanUsername}2).` },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    await (adminClient as any)
      .from('tango_profiles')
      .upsert({
        id: userId,
        email: internalEmail,
        full_name,
        phone,
        address,
        role: 'user',
        must_change_password: true,
      });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mujeres-del-tango.vercel.app';
    const loginUrl = `${siteUrl}/login`;
    const message = `¡Hola ${full_name}! Te saluda Maris de Mujeres del Tango. Ya creamos tu cuenta en nuestra tienda. Podés ingresar con tu usuario: ${cleanUsername} y contraseña temporal: ${temp_password}. Al entrar por primera vez, el sistema te pedirá que elijas tu contraseña definitiva. Enlace: ${loginUrl}`;

    const whatsAppLink = phone ? buildWhatsAppLink(phone, message) : null;

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        username: cleanUsername,
        full_name,
        phone,
        address,
      },
      tempPassword: temp_password,
      message,
      whatsAppLink,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al crear cliente' }, { status: 500 });
  }
}

// PUT /api/admin/users - Modificar datos de cliente existente
export async function PUT(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const body = await req.json();
    let { userId, full_name, username, phone, address, detailed_address, role } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 });
    }

    if (detailed_address && !address) {
      address = formatDetailedAddress(detailed_address);
    }

    const updateFields: any = {};
    if (full_name !== undefined) updateFields.full_name = full_name.trim();
    if (phone !== undefined) updateFields.phone = phone.trim();
    if (address !== undefined) updateFields.address = address.trim();
    if (role !== undefined) updateFields.role = role;

    // Si cambia el usuario
    if (username && username.trim()) {
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
      const newEmail = usernameToInternalEmail(cleanUsername);
      updateFields.email = newEmail;

      // Actualizar en auth.users
      await adminClient.auth.admin.updateUserById(userId, {
        email: newEmail,
        user_metadata: {
          username: cleanUsername,
          full_name: full_name?.trim(),
          phone: phone?.trim(),
          address: address?.trim(),
        },
      });
    }

    // Actualizar en tango_profiles
    const { data: updatedProfile, error: updateError } = await (adminClient as any)
      .from('tango_profiles')
      .update(updateFields)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar cliente' }, { status: 500 });
  }
}

// PATCH /api/admin/users - Resetear contraseña provisoria
export async function PATCH(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const body = await req.json();
    const { userId, temp_password = '123456' } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 });
    }

    const { error: resetError } = await adminClient.auth.admin.updateUserById(userId, {
      password: temp_password,
    });

    if (resetError) throw resetError;

    await (adminClient as any)
      .from('tango_profiles')
      .update({ must_change_password: true })
      .eq('id', userId);

    const { data: profile } = await (adminClient as any)
      .from('tango_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const username = extractUsername(profile?.email);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mujeres-del-tango.vercel.app';
    const loginUrl = `${siteUrl}/login`;
    const message = `¡Hola ${profile?.full_name}! Te saluda Maris de Mujeres del Tango. Se reestableció tu acceso. Tu usuario es: ${username} y tu contraseña temporal es: ${temp_password}. Ingresá en ${loginUrl} y elegí tu nueva contraseña.`;
    const whatsAppLink = profile?.phone ? buildWhatsAppLink(profile.phone, message) : null;

    return NextResponse.json({
      success: true,
      tempPassword: temp_password,
      message,
      whatsAppLink,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al resetear contraseña' }, { status: 500 });
  }
}

// DELETE /api/admin/users - Eliminar cliente por completo
export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Eliminar perfil de tango_profiles
    await (adminClient as any).from('tango_profiles').delete().eq('id', userId);

    // 2. Eliminar de auth.users
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.warn('Nota al eliminar auth.user:', deleteAuthError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al eliminar cliente' }, { status: 500 });
  }
}
