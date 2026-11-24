import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { buildWhatsAppLink } from '@/lib/utils';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('tango_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return (profile as any)?.role === 'admin' || user.email?.toLowerCase().includes('maris');
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
    let { full_name, email, phone, address, temp_password = '123456' } = body;

    if (!full_name || !full_name.trim()) {
      return NextResponse.json({ error: 'El nombre completo es requerido' }, { status: 400 });
    }

    if (!email || !email.trim()) {
      const sanitizedName = full_name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '.');
      email = `${sanitizedName}@mujeresdeltango.com`;
    }

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: temp_password,
      email_confirm: true,
      user_metadata: {
        app: 'mujeres_del_tango',
        full_name,
        phone,
        address,
        role: 'user',
        must_change_password: true,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    await (adminClient as any)
      .from('tango_profiles')
      .upsert({
        id: userId,
        email,
        full_name,
        phone,
        address,
        role: 'user',
        must_change_password: true,
      });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const loginUrl = `${siteUrl}/login`;
    const message = `¡Hola ${full_name}! Te saluda Maris de Mujeres del Tango 🌹 Ya creamos tu cuenta en nuestra tienda. Podés ingresar con tu correo: ${email} y contraseña temporal: ${temp_password}. Al entrar por primera vez, el sistema te pedirá que elijas tu contraseña definitiva. Enlace: ${loginUrl}`;

    const whatsAppLink = phone ? buildWhatsAppLink(phone, message) : null;

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const loginUrl = `${siteUrl}/login`;
    const message = `¡Hola ${profile?.full_name}! Te saluda Maris de Mujeres del Tango 🌹 Se reestableció tu acceso temporal. Tu nueva contraseña temporal es: ${temp_password}. Ingresá en ${loginUrl} y elegí tu nueva contraseña.`;
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
