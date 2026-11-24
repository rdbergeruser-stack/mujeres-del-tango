import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Si no están configuradas las variables de entorno aún, continuar sin bloquear desarrollo local
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Si el usuario está autenticado, verificamos su perfil
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, must_change_password')
      .eq('id', user.id)
      .single();

    const mustChangePassword = (profile as any)?.must_change_password ?? false;
    const role = (profile as any)?.role ?? 'user';

    // Regla de Onboarding Obligatorio: si must_change_password = true, redirigir a /cambiar-clave
    if (
      mustChangePassword &&
      pathname !== '/cambiar-clave' &&
      !pathname.startsWith('/api') &&
      !pathname.startsWith('/_next') &&
      pathname !== '/favicon.ico'
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/cambiar-clave';
      return NextResponse.redirect(redirectUrl);
    }

    // Si ya no debe cambiar contraseña y entra a /cambiar-clave, mandarlo a la home
    if (!mustChangePassword && pathname === '/cambiar-clave') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = role === 'admin' ? '/admin' : '/';
      return NextResponse.redirect(redirectUrl);
    }

    // Si intenta entrar al login estando autenticado
    if (pathname === '/login') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = role === 'admin' ? '/admin' : '/';
      return NextResponse.redirect(redirectUrl);
    }

    // Protección de rutas Admin
    if (pathname.startsWith('/admin') && role !== 'admin') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      return NextResponse.redirect(redirectUrl);
    }
  } else {
    // Usuario NO autenticado intentando acceder a rutas protegidas
    if (
      pathname.startsWith('/admin') ||
      pathname.startsWith('/mis-compras') ||
      pathname === '/cambiar-clave'
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
