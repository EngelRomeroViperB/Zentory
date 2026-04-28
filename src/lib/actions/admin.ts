import { z } from "zod";
import { adminAction, getAuthContext, requireAdmin } from "../safe-action";
import { revalidatePath } from "next/cache";

const updateRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["admin", "vendedor", "bodeguero"])
});

export const updateUserRole = adminAction(
  updateRoleSchema,
  async (parsedInput) => {
    const ctx = await getAuthContext();
    requireAdmin(ctx.role);
    
    const { user_id, role } = parsedInput;

    if (user_id === ctx.user.id) {
      throw new Error("No puedes cambiar tu propio rol.");
    }

    const { error } = await ctx.supabase
      .from('user_roles')
      .update({ role })
      .eq('user_id', user_id);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/usuarios');
    return { success: true };
  }
);

const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["admin", "vendedor", "bodeguero"])
});

export const createUser = adminAction(
  createUserSchema,
  async (parsedInput) => {
    const ctx = await getAuthContext();
    requireAdmin(ctx.role);
    
    const { email, password, role } = parsedInput;

    // Crear usuario en Supabase Auth usando admin API
    const { data: authData, error: authError } = await ctx.supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("No se pudo crear el usuario.");

    // Asignar rol en user_roles
    const { error: roleError } = await ctx.supabase
      .from('user_roles')
      .insert({ user_id: authData.user.id, role });

    if (roleError) throw new Error(roleError.message);

    revalidatePath('/admin/usuarios');
    return { success: true, user_id: authData.user.id };
  }
);
