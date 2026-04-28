'use client';

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { purchaseSchema, PurchaseFormValues } from "@/lib/validations/purchase.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPurchase } from "@/lib/actions/purchases";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import { fromDBString, Dinero } from "@/lib/config/dinero";

export function PurchaseForm({ suppliers, products }: { suppliers: any[], products: any[] }) {
  const router = useRouter();
  
  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplier_id: "",
      invoice_number: "",
      notes: "",
      items: [
        { product_id: "", quantity: 1, unit_cost: "0", location: "", expiry_date: null }
      ]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Calcular total en tiempo real usando Dinero.js (sin floating-point bugs)
  const items = form.watch("items");
  const totalDinero = items.reduce((acc, item) => {
    return acc.add(fromDBString(item.unit_cost || "0").multiply(item.quantity || 0));
  }, Dinero({ amount: 0, currency: 'USD' }));

  async function onSubmit(data: PurchaseFormValues) {
    const res = await createPurchase(data);
    if (res?.data?.success) {
      toast.success("Compra registrada correctamente");
      router.push("/inventario/compras");
    } else {
      toast.error(res?.serverError || "Error al registrar la compra");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Cabecera */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 border rounded-md">
          <FormField
            control={form.control}
            name="supplier_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proveedor</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione proveedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="invoice_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nro. Factura Proveedor</FormLabel>
                <FormControl>
                  <Input placeholder="Opcional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="col-span-1 sm:col-span-2 md:col-span-1">
                <FormLabel>Notas</FormLabel>
                <FormControl>
                  <Input placeholder="Observaciones..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Líneas de detalle */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Detalle de Compra</h3>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => append({ product_id: "", quantity: 1, unit_cost: "0", location: "", expiry_date: null })}
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar Ítem
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col sm:flex-row gap-2 sm:items-end border p-4 rounded-md">
                
                <FormField
                  control={form.control}
                  name={`items.${index}.product_id`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Producto</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione producto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem className="w-full sm:w-24">
                      <FormLabel>Cant.</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.unit_cost`}
                  render={({ field }) => (
                    <FormItem className="w-full sm:w-32">
                      <FormLabel>Costo Unit.</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.location`}
                  render={({ field }) => (
                    <FormItem className="w-full sm:w-32">
                      <FormLabel>Ubicación</FormLabel>
                      <FormControl>
                        <Input placeholder="Bodega..." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="button" variant="ghost" className="text-red-500 mb-1 px-3 self-end" onClick={() => remove(index)} disabled={fields.length === 1}>
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-4 p-4 bg-slate-100 rounded-md">
            <div className="text-xl font-bold">
              Total: {totalDinero.toFormat('$0,0.00')}
            </div>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Registrando Compra..." : "Registrar Compra"}
        </Button>
      </form>
    </Form>
  );
}
