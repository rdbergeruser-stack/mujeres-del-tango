import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
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

  if (user) {
    const { data: profile } = await supabase
      .from('tango_profiles')
      .select('role, must_change_password')
      .eq('id', user.id)
      .single();

    const mustChangePassword = (profile as any)?.must_change_password ?? false;
    const role = (profile as any)?.role ?? 'user';

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

    if (!mustChangePassword && pathname === '/cambiar-clave') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = role === 'admin' ? '/admin' : '/';
      return NextResponse.redirect(redirectUrl);
    }

    if (pathname === '/login') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = role === 'admin' ? '/admin' : '/';
      return NextResponse.redirect(redirectUrl);
    }

    if (pathname.startsWith('/admin') && role !== 'admin') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      return NextResponse.redirect(redirectUrl);
    }
  } else {
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
