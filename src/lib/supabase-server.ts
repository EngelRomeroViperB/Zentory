import { createClient } from '@supabase/supabase-js';

// Cliente simple de Supabase para uso en el servidor
// Funciona tanto en Node.js como en Edge Runtime
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
