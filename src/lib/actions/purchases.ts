'use server';

import { purchaseSchema, PurchaseFormValues } from '../validations/purchase.schema';
import { bodegueroAction } from '../safe-action';
import { revalidatePath } from 'next/cache';

export const createPurchase = bodegueroAction
  .schema(purchaseSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Preparar items para la RPC (convertir fechas a ISO strings)
    const itemsForRpc = parsedInput.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      expiry_date: item.expiry_date ? item.expiry_date.toISOString() : null,
      location: item.location || null,
    }));

    // Usar la RPC atómica que maneja toda la transacción
    const { data, error } = await ctx.supabase.rpc('create_purchase_atomic', {
      p_supplier_id: parsedInput.supplier_id || null,
      p_invoice_number: parsedInput.invoice_number || null,
      p_notes: parsedInput.notes || null,
      p_created_by: ctx.user.id,
      p_items: itemsForRpc,
    });

    if (error) throw new Error(error.message);

    revalidatePath('/inventario/compras');
    revalidatePath('/inventario/productos');
    return { success: true, data };
  });
