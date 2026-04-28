import { z } from 'zod';

// Regex para campos monetarios: hasta 10 dígitos enteros, máximo 2 decimales.
// Bloquea notación científica ("1e5") y decimales excesivos ("0.00001").
const monetaryString = z.string()
  .regex(/^\d{1,10}(\.\d{1,2})?$/, {
    message: "Formato inválido. Use hasta 10 dígitos enteros y 2 decimales (ej: 15000.50)",
  })
  .refine((val) => parseFloat(val) >= 0, {
    message: "El valor debe ser mayor o igual a 0",
  });

export const productSchema = z.object({
  code_qr_bar: z.string().optional(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(120, "El nombre no debe exceder los 120 caracteres"),
  category_id: z.string().uuid("Categoría inválida").nullable().optional(),
  cost_price: monetaryString,
  sale_price: monetaryString,
  min_stock: z.number().int("Debe ser un número entero").min(0, "El stock mínimo debe ser mayor o igual a 0"),
}).refine((data) => parseFloat(data.sale_price) >= parseFloat(data.cost_price), {
  message: "El precio de venta no puede ser menor al costo",
  path: ["sale_price"], // Apuntar el error al campo sale_price
});

export type ProductFormValues = z.infer<typeof productSchema>;
