'use server';

import { batchSchema, BatchFormValues } from '../validations/batch.schema';
import { bodegueroAction, getAuthContext, requireBodeguero } from '../safe-action';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const addBatchSchema = z.object({
  productId: z.string().uuid(),
  data: batchSchema,
});

const updateBatchSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  data: z.object({
    location: z.string().optional(),
    expiry_date: z.date().optional().nullable(),
    batch_code: z.string().optional(),
  }),
});

export const addBatch = bodegueroAction(
  addBatchSchema,
  async (parsedInput) => {
    const ctx = await getAuthContext();
    requireBodeguero(ctx.role);
    
    const { productId, data } = parsedInput;
    
    // 1. Insertar el lote primero para obtener el batch_id
    const { data: batch, error: batchError } = await ctx.supabase
      .from('product_batches')
      .insert({
        product_id: productId,
        batch_code: data.batch_code,
        quantity: 0, // se actualizará en register_entry
        unit_cost: data.unit_cost,
        expiry_date: data.expiry_date ? data.expiry_date.toISOString() : null,
        location: data.location,
      })
      .select('id')
      .single();

    if (batchError) throw new Error(batchError.message);

    // 2. Llamar a register_entry para asentar el kardex y sumar cantidad al lote
    const { error: entryError } = await ctx.supabase.rpc('register_entry', {
      p_product_id: productId,
      p_batch_id: batch.id,
      p_quantity: data.quantity,
      p_unit_cost: Number(data.unit_cost),
      p_reference: 'Ingreso manual de lote',
    });

    if (entryError) throw new Error(entryError.message);

    revalidatePath(`/inventario/productos/${productId}`);
    revalidatePath('/inventario/productos');
    return { success: true, data: batch };
  }
);

export const updateBatch = bodegueroAction(
  updateBatchSchema,
  async (parsedInput) => {
    const ctx = await getAuthContext();
    requireBodeguero(ctx.role);
    
    const { id, productId, data } = parsedInput;
    
    // Solo permitir campos no financieros
    const updateData: Record<string, unknown> = {};
    if (data.location !== undefined) updateData.location = data.location;
    if (data.expiry_date !== undefined) updateData.expiry_date = data.expiry_date ? data.expiry_date.toISOString() : null;
    if (data.batch_code !== undefined) updateData.batch_code = data.batch_code;

    const { error } = await ctx.supabase
      .from('product_batches')
      .update(updateData)
      .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath(`/inventario/productos/${productId}`);
    return { success: true };
  }
);
