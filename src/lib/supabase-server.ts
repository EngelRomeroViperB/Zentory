import { createServerClient as createClientSSR, type CookieOptions } from '@supabase/ssr';
import { createBrowserClient } from './supabase-client';

// Cliente de Supabase universal que se adapta al entorno (Servidor o Cliente)
// Se usa importación dinámica de next/headers para evitar errores en el bundle del cliente
export async function createServerClient() {
  if (typeof window !== 'undefined') {
    return createBrowserClient();
  }

  try {
    const { cookies } = await import('next/headers');
    const cookieStore = cookies();

    return createClientSSR(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Ignorado en Server Components
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // Ignorado en Server Components
            }
          },
        },
      }
    );
  } catch (error) {
    // Si algo falla con next/headers, devolvemos un cliente básico
    // Esto puede pasar en entornos de build muy restrictivos
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
}
