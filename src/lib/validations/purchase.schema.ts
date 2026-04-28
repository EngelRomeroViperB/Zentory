import { z } from 'zod';

// Regex para campos monetarios: hasta 10 dígitos enteros, máximo 2 decimales.
const monetaryString = z.string()
  .regex(/^\d{1,10}(\.\d{1,2})?$/, {
    message: "Formato inválido. Use hasta 10 dígitos enteros y 2 decimales (ej: 15000.50)",
  })
  .refine((val) => parseFloat(val) >= 0, {
    message: "El costo unitario debe ser mayor o igual a 0",
  });

export const purchaseItemSchema = z.object({
  product_id: z.string().uuid("Producto inválido"),
  quantity: z.number().int("Debe ser un número entero").min(1, "La cantidad debe ser mayor a 0"),
  unit_cost: monetaryString,
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
