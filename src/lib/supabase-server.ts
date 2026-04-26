import { createServerClient as createServerClientSSR } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cliente de Supabase para uso en el servidor (Server Components / Actions)
export async function createServerClient() {
  const cookieStore = await cookies();

  return createServerClientSSR<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, any> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Ignoramos el error aquí porque este bloque se ejecuta en
            // Server Components (que no pueden modificar headers de cookies).
          }
        },
      },
    }
  );
}
