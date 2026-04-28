import { createServerClient as createClientSSR, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cliente de Supabase para uso en el servidor (Server Components y Actions)
export async function createServerClient() {
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
            // Este catch es necesario porque las Server Components no pueden setear cookies
            // solo las Server Actions y Route Handlers pueden.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Mismo caso que set
          }
        },
      },
    }
  );
}
