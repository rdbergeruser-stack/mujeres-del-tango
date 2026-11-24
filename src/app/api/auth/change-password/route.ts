import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/auth/change-password - Cambio obligatorio o voluntario de contraseña
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // 1. Actualizar contraseña en Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // 2. Desactivar el flag must_change_password en tango_profiles
    const adminClient = createAdminClient();
    const { error: profileError } = await (adminClient as any)
      .from('tango_profiles')
      .update({ must_change_password: false })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error al actualizar must_change_password:', profileError);
    }

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada con éxito',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al cambiar contraseña' },
      { status: 500 }
    );
  }
}
