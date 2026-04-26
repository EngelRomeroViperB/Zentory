import { createBrowserClient as createBrowserClientSSR } from '@supabase/ssr';

// Cliente de Supabase para uso en el navegador (Client Components)
export function createBrowserClient() {
  return createBrowserClientSSR<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
