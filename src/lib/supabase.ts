import { createBrowserClient as createBrowserClientSSR } from '@supabase/ssr';

// ══════════════════════════════════════════════════════════════════════════
// Cliente de Supabase para componentes y hooks de lado del cliente
// Usa este en:
// - Client Components ("use client")
// - useEffect / event handlers
// ══════════════════════════════════════════════════════════════════════════
export function createBrowserClient() {
  return createBrowserClientSSR<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// NOTA: Para Server Components y Server Actions, importar desde:
// import { createServerClient } from '@/lib/supabase-server';
