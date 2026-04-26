import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from "next-safe-action";
import { createServerClient } from "@/lib/supabase-server";

class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

// Cliente Base Autenticado
export const authAction = createSafeActionClient({
  handleReturnedServerError(e) {
    if (e instanceof ActionError) {
      return e.message;
    }
    // En producción, esto manda a Sentry idealmente
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
}).use(async ({ next }) => {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new ActionError("No autenticado");
  }

  const { data: role } = await supabase.rpc('get_my_role');

  return next({ ctx: { user: session.user, role: role as string, supabase } });
});

// Cliente Admin
export const adminAction = authAction.use(async ({ ctx, next }) => {
  if (ctx.role !== 'admin') {
    throw new ActionError("Acceso denegado. Se requiere rol de administrador.");
  }
  return next({ ctx });
});

// Cliente Bodeguero
export const bodegueroAction = authAction.use(async ({ ctx, next }) => {
  if (ctx.role !== 'admin' && ctx.role !== 'bodeguero') {
    throw new ActionError("Acceso denegado. Se requiere rol de bodeguero.");
  }
  return next({ ctx });
});
