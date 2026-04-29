import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Actualizar request para que el resto del middleware vea el cambio
          request.cookies.set({ name, value, ...options });
          // Actualizar response para que el navegador reciba la cookie
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // Actualizar request
          request.cookies.set({ name, value: '', ...options });
          // Actualizar response
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const url = request.nextUrl;
  const path = url.pathname;

  // Rutas públicas
  if (['/login', '/register', '/forgot-password', '/auth/callback'].includes(path)) {
    if (session) {
      return NextResponse.redirect(new URL('/inventario', request.url));
    }
    return response;
  }

  // Si no hay sesión y va a una ruta protegida
  if (!session) {
    if (!path.startsWith('/api') && !path.startsWith('/_next') && path !== '/unauthorized') {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  // Rutas que requieren validación de rol
  if (path.startsWith('/admin') || path.includes('/libro-') || path.includes('/devoluciones')) {
    const { data: role } = await supabase.rpc('get_my_role');
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  if (path.startsWith('/pos')) {
    const { data: role } = await supabase.rpc('get_my_role');
    if (role !== 'admin' && role !== 'vendedor') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
