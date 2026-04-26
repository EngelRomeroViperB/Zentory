import { z } from 'zod';

export const saleItemSchema = z.object({
  product_id: z.string().uuid(),
  batch_id: z.string().uuid().nullable().optional(),
  quantity: z.number().int().min(1),
  unit_price: z.string(),
  unit_cost: z.string(),
  discount_pct: z.number().min(0).max(100),
  tax_rate: z.number().min(0).max(100),
});

export const checkoutSchema = z.object({
  client_id: z.string().uuid().nullable().optional(),
  items: z.array(saleItemSchema).min(1, "Debe agregar al menos un ítem al carrito"),
  tax_rate: z.number().min(0).max(100).default(19),
  notes: z.string().optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
