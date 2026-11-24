import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/auth/register - Registro público de clientes
export async function POST(req: NextRequest) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
      return NextResponse.json(
        {
          error:
            'Aún no están configuradas las variables de entorno de Supabase en Vercel. Agregá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel -> Settings -> Environment Variables y hacé Redeploy.',
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { email, password, full_name, phone, address } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre completo son obligatorios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          app: 'mujeres_del_tango',
          full_name,
          phone: phone || '',
          address: address || '',
          must_change_password: false,
          role: 'user',
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al conectar con el servidor de autenticación' },
      { status: 500 }
    );
  }
}
