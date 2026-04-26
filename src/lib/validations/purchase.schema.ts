import { z } from 'zod';

export const purchaseItemSchema = z.object({
  product_id: z.string().uuid("Producto inválido"),
  quantity: z.number().int("Debe ser un número entero").min(1, "La cantidad debe ser mayor a 0"),
  unit_cost: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "El costo unitario debe ser un número mayor o igual a 0",
  }),
  expiry_date: z.date().optional().nullable(),
  location: z.string().optional().nullable(),
});

export const purchaseSchema = z.object({
  supplier_id: z.string().uuid("Proveedor inválido").nullable().optional(),
  invoice_number: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "Debe agregar al menos un ítem a la compra"),
  notes: z.string().optional(),
});

export type PurchaseFormValues = z.infer<typeof purchaseSchema>;
export type PurchaseItemFormValues = z.infer<typeof purchaseItemSchema>;
