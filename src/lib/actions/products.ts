'use server';

import { productSchema, ProductFormValues } from '../validations/product.schema';
import { bodegueroAction, adminAction, getAuthContext, requireBodeguero, requireAdmin } from '../safe-action';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createProductSchema = productSchema;
const updateProductSchema = z.object({
  id: z.string().uuid(),
  data: productSchema,
});
const deleteProductSchema = z.object({
  id: z.string().uuid(),
});

export const createProduct = bodegueroAction
  .schema(createProductSchema)
  .action(async ({ parsedInput }) => {
    const ctx = await getAuthContext();
    requireBodeguero(ctx.role);
    
    const { data, error } = await ctx.supabase
      .from('products')
      .insert({
        ...parsedInput,
        category_id: parsedInput.category_id || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath('/inventario/productos');
    return { success: true, data };
  });

export const updateProduct = bodegueroAction
  .schema(updateProductSchema)
  .action(async ({ parsedInput }) => {
    const ctx = await getAuthContext();
    requireBodeguero(ctx.role);
    
    const { id, data } = parsedInput;
    
    const { data: updatedData, error } = await ctx.supabase
      .from('products')
      .update({
        ...data,
        category_id: data.category_id || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath('/inventario/productos');
    revalidatePath(`/inventario/productos/${id}`);
    return { success: true, data: updatedData };
  });

export const deleteProduct = adminAction
  .schema(deleteProductSchema)
  .action(async ({ parsedInput }) => {
    const ctx = await getAuthContext();
    requireAdmin(ctx.role);
    
    const { id } = parsedInput;
    
    // Verificar que el stock sea 0
    const { data: product, error: fetchError } = await ctx.supabase
      .from('products')
      .select('current_stock')
      .eq('id', id)
      .single();

    if (fetchError) throw new Error(fetchError.message);
    if (product.current_stock > 0) {
      throw new Error('No se puede eliminar un producto con stock mayor a 0');
    }

    const { error } = await ctx.supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);

    revalidatePath('/inventario/productos');
    return { success: true };
  });
