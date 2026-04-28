import { createSafeActionClient } from "next-safe-action";
import { createServerClient } from "@/lib/supabase-server";

export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

// Cliente base con manejo de errores
// next-safe-action v6 API: actionClient(schema, serverCodeFn) => SafeAction
export const actionClient = createSafeActionClient({
  handleReturnedServerError(e) {
    if (e instanceof ActionError) {
      return e.message;
    }
    return "Error del servidor";
  },
});

// Helper para obtener contexto de autenticación
export async function getAuthContext() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new ActionError("No autenticado");
  }

  const { data: role } = await supabase.rpc('get_my_role');

  return {
    user: session.user,
    role: role as string,
    supabase
  };
}

// Helper para verificar rol admin
export function requireAdmin(role: string) {
  if (role !== 'admin') {
    throw new ActionError("Acceso denegado. Se requiere rol de administrador.");
  }
}

// Helper para verificar rol bodeguero o admin
export function requireBodeguero(role: string) {
  if (role !== 'admin' && role !== 'bodeguero') {
    throw new ActionError("Acceso denegado. Se requiere rol de bodeguero.");
  }
}

// Alias para compatibilidad semántica (misma base, la verificación de roles se hace dentro del action)
export const authAction = actionClient;
export const adminAction = actionClient;
export const bodegueroAction = actionClient;
