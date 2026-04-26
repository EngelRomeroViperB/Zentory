'use server';

import { checkoutSchema } from '../validations/sale.schema';
import { revalidatePath } from 'next/cache';
import { authAction, adminAction } from '../safe-action';
import { z } from 'zod';

export const completeSale = authAction
  .schema(checkoutSchema.extend({ deviceId: z.string().optional() }))
  .action(async ({ parsedInput, ctx }) => {
    // Verificamos vendedor o admin dentro del authAction genérico
    if (ctx.role !== 'admin' && ctx.role !== 'vendedor') {
      throw new Error("No tienes permisos para realizar una venta.");
    }

    const { deviceId, ...saleData } = parsedInput;

    const { data: saleResult, error: saleError } = await ctx.supabase.rpc('create_sale', {
      p_client_id: saleData.client_id || null,
      p_vendedor_id: ctx.user.id,
      p_items: saleData.items,
      p_tax_rate: saleData.tax_rate,
    });

    if (saleError) throw new Error(`Error al procesar la venta: ${saleError.message}`);

    const result = saleResult[0];

    if (deviceId) {
      let clientName = 'Ocasional';
      let clientNit = '';
      if (saleData.client_id) {
        const { data: client } = await ctx.supabase.from('clients').select('name, nit').eq('id', saleData.client_id).single();
        if (client) {
          clientName = client.name;
          clientNit = client.nit || '';
        }
      }

      const printContent = {
        invoice_number: result.invoice_number,
        created_at: new Date().toISOString(),
        client_name: clientName,
        client_nit: clientNit,
        vendedor: ctx.user.email,
        items: saleData.items,
        total: result.total,
        tax_amount: result.tax_amount,
        notes: saleData.notes
      };

      await ctx.supabase.from('print_queue').insert({
        content: printContent as any,
        device_id: deviceId,
        status: 'PENDING'
      });
    }

    revalidatePath('/ventas');
    revalidatePath('/inventario/productos');

    return { success: true, sale_id: result.sale_id, invoice_number: result.invoice_number };
  });

export const voidSale = adminAction
  .schema(z.object({ sale_id: z.string().uuid(), reason: z.string().min(10) }))
  .action(async ({ parsedInput, ctx }) => {
    const { sale_id, reason } = parsedInput;

    const { error } = await ctx.supabase.rpc('void_sale', {
      p_sale_id: sale_id,
      p_reason: reason,
    });

    if (error) throw new Error(error.message);

    revalidatePath('/ventas');
    revalidatePath(`/ventas/${sale_id}`);
    revalidatePath('/inventario/productos');

    return { success: true };
  });
