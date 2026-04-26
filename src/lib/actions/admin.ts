import { z } from "zod";
import { adminAction } from "../safe-action";
import { revalidatePath } from "next/cache";

const updateRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["admin", "vendedor", "bodeguero"])
});

export const updateUserRole = adminAction
  .schema(updateRoleSchema)
  .action(async ({ parsedInput, ctx }) => {
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
  });
