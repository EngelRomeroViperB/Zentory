import { z } from 'zod';

export const batchSchema = z.object({
  batch_code: z.string().optional(),
  quantity: z.number().int("Debe ser un número entero").min(1, "La cantidad debe ser mayor a 0"),
  unit_cost: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "El costo unitario debe ser un número mayor o igual a 0",
  }),
  expiry_date: z.date().optional().nullable(),
  location: z.string().optional().nullable(),
});

export type BatchFormValues = z.infer<typeof batchSchema>;
