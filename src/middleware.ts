import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from "@/lib/supabase-server";
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  // Client setup is required for auth logic, skipped exact implementation for brevity
  // Assuming createServerClient creates a functional client that reads/writes cookies correctly

  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  const url = request.nextUrl;
  const path = url.pathname;

  // Rutas públicas
  if (['/login', '/register', '/forgot-password', '/auth/callback'].includes(path)) {
    if (session) {
      return NextResponse.redirect(new URL('/inventario', request.url));
    }
    return res;
  }

  // Si no hay sesión y va a una ruta protegida
  if (!session) {
    if (!path.startsWith('/api') && !path.startsWith('/_next')) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(redirectUrl);
    }
    return res;
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

  return res;
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
