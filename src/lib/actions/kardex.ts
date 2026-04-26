'use server';

import { adminAction } from '../safe-action';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const adjustmentSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1, 'La cantidad debe ser mayor a 0'),
  notes: z.string().min(1, 'Debe incluir una nota explicando el ajuste'),
});

/**
 * Registra un ajuste de inventario (descuento de stock).
 * NOTA: Según el schema, ADJUSTMENT siempre resta stock (como EXIT).
 * Para aumentar stock, usar las funciones de compras o devoluciones.
 */
export const registerAdjustment = adminAction
  .schema(adjustmentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { productId, quantity, notes } = parsedInput;

    // 1. Obtener producto para el unit_cost
    const { data: product, error: fetchError } = await ctx.supabase
      .from('products')
      .select('cost_price')
      .eq('id', productId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    // 2. Insertar movimiento ADJUSTMENT
    const { error: insertError } = await ctx.supabase
      .from('kardex_movements')
      .insert({
        product_id: productId,
        type: 'ADJUSTMENT',
        quantity: quantity, // el CHECK dice quantity > 0
        unit_cost: product.cost_price,
        notes: notes,
        created_by: ctx.user.id,
      });

    if (insertError) throw new Error(insertError.message);

    // 3. Descontar stock usando apply_fifo_exit (ADJUSTMENT resta igual que EXIT)
    const { error: updateError } = await ctx.supabase.rpc('apply_fifo_exit', {
      p_product_id: productId,
      p_quantity: quantity,
      p_reference: `Ajuste manual: ${notes}`,
    });

    if (updateError) throw new Error(updateError.message);

    revalidatePath(`/inventario/productos/${productId}`);
    revalidatePath(`/inventario/kardex/${productId}`);
    return { success: true };
  });
