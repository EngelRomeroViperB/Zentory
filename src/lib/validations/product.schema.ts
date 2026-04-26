import { z } from 'zod';

export const productSchema = z.object({
  code_qr_bar: z.string().optional(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(120, "El nombre no debe exceder los 120 caracteres"),
  category_id: z.string().uuid("Categoría inválida").nullable().optional(),
  cost_price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "El costo debe ser un número mayor o igual a 0",
  }),
  sale_price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "El precio de venta debe ser un número mayor o igual a 0",
  }),
  min_stock: z.number().int("Debe ser un número entero").min(0, "El stock mínimo debe ser mayor o igual a 0"),
}).refine((data) => Number(data.sale_price) >= Number(data.cost_price), {
  message: "El precio de venta no puede ser menor al costo",
  path: ["sale_price"], // Apuntar el error al campo sale_price
});

export type ProductFormValues = z.infer<typeof productSchema>;
