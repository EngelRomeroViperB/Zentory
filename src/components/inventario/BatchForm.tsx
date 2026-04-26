'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { batchSchema, BatchFormValues } from "@/lib/validations/batch.schema";
import { addBatch } from "@/lib/actions/batches";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BatchFormProps {
  productId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BatchForm({ productId, onSuccess, onCancel }: BatchFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      batch_code: "",
      quantity: 1,
      unit_cost: "",
      expiry_date: null,
      location: "",
    },
  });

  const onSubmit = async (data: BatchFormValues) => {
    setIsSubmitting(true);
    try {
      await addBatch({
        product_id: productId,
        ...data,
        expiry_date: data.expiry_date?.toISOString().split('T')[0] || null,
      });
      toast.success("Lote agregado exitosamente");
      onSuccess();
    } catch (error) {
      toast.error("Error al agregar el lote");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Código de Lote</label>
        <input
          {...register("batch_code")}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Ej: LOTE-001"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Ubicación</label>
        <input
          {...register("location")}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Ej: Estante A-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Fecha de Vencimiento</label>
        <input
          type="date"
          {...register("expiry_date", { valueAsDate: true })}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Cantidad *</label>
        <input
          type="number"
          {...register("quantity", { valueAsNumber: true })}
          className="w-full px-3 py-2 border rounded-md"
          min={1}
        />
        {errors.quantity && (
          <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Costo Unitario *</label>
        <input
          type="number"
          step="0.01"
          {...register("unit_cost")}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="0.00"
        />
        {errors.unit_cost && (
          <p className="text-red-500 text-sm mt-1">{errors.unit_cost.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar Lote"}
        </Button>
      </div>
    </form>
  );
}
