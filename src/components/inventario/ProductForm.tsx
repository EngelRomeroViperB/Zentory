'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductFormValues } from "@/lib/validations/product.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { customAlphabet } from "nanoid";

// Alfabeto numérico para códigos de barras comerciales (estándar tipo EAN-13)
const generateBarcode = customAlphabet('0123456789', 13);

export function ProductForm({ initialData, categories }: { initialData?: any, categories: any[] }) {
  const router = useRouter();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData ? {
      code_qr_bar: initialData.code_qr_bar || "",
      name: initialData.name,
      category_id: initialData.category_id || undefined,
      cost_price: initialData.cost_price?.toString() || "0",
      sale_price: initialData.sale_price?.toString() || "0",
      min_stock: initialData.min_stock || 0,
    } : {
      code_qr_bar: "",
      name: "",
      cost_price: "0",
      sale_price: "0",
      min_stock: 0,
    },
  });

  const costStr = form.watch("cost_price");
  const saleStr = form.watch("sale_price");
  const costVal = parseFloat(costStr) || 0;
  const saleVal = parseFloat(saleStr) || 0;
  const margin = costVal > 0 ? (((saleVal - costVal) / costVal) * 100).toFixed(2) : "0.00";

  async function onSubmit(data: ProductFormValues) {
    const res = initialData 
      ? await updateProduct({ id: initialData.id, data })
      : await createProduct(data);
      
    if (res?.data?.success) {
      toast.success(initialData ? "Producto actualizado" : "Producto creado");
      router.push("/inventario/productos");
    } else {
      toast.error(res?.serverError || "Error al guardar el producto");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code_qr_bar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código / QR</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="Ej: 7701234567" {...field} />
                  </FormControl>
                  <Button type="button" variant="outline" onClick={() => form.setValue('code_qr_bar', generateBarcode())}>Generar</Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del producto</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Jabón Rey" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="min_stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Mínimo</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 rounded-md bg-slate-50">
          <FormField
            control={form.control}
            name="cost_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo Unitario ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sale_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio Venta ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="col-span-1 sm:col-span-2 text-sm text-gray-600 font-medium">
            Margen de ganancia calculado: <span className={Number(margin) < 10 ? "text-red-500" : "text-green-600"}>{margin}%</span>
          </div>
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Guardando..." : "Guardar Producto"}
        </Button>
      </form>
    </Form>
  );
}
