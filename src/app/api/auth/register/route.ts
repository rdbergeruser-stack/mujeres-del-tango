import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { usernameToInternalEmail } from '@/lib/utils';

// POST /api/auth/register - Registro público por NOMBRE DE USUARIO (sin emails ni spam)
export async function POST(req: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const body = await req.json();
    let { username, password, full_name, phone, address } = body;

    if (!username || !username.trim()) {
      return NextResponse.json(
        { error: 'El nombre de usuario es obligatorio' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const cleanUsername = username
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9._-]/g, '');

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: 'El usuario debe tener al menos 3 caracteres (letras, números o guiones)' },
        { status: 400 }
      );
    }

    const internalEmail = usernameToInternalEmail(cleanUsername);

    // Creamos el usuario automáticamente confirmado en Supabase Auth mediante Admin Client
    // Esto garantiza 0 envío de correos, 0 spam y 0 rate limits.
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: internalEmail,
      password,
      email_confirm: true,
      user_metadata: {
        app: 'mujeres_del_tango',
        username: cleanUsername,
        full_name: full_name?.trim() || cleanUsername,
        phone: phone || '',
        address: address || '',
        must_change_password: false,
        role: 'user',
      },
    });

    if (authError) {
      if (authError.message.includes('already been registered') || authError.message.includes('unique')) {
        return NextResponse.json(
          { error: `El usuario "${cleanUsername}" ya existe. Por favor elegí otro nombre de usuario.` },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      username: cleanUsername,
      internalEmail,
      user: authData.user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al registrar usuario' },
      { status: 500 }
    );
  }
}
