'use client';

import * as React from "react";
import { useCartStore } from "@/lib/store/cart.store";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export function CartSummary({ onCheckout }: { onCheckout: () => void }) {
  const { 
    getSubtotal, 
    getTaxAmount, 
    getTotal, 
    getItemCount, 
    clearCart,
    global_discount,
    setGlobalDiscount,
    items
  } = useCartStore();

  const taxRate = Number(process.env.NEXT_PUBLIC_DEFAULT_TAX_RATE || 19);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
        <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
        <p>El carrito está vacío</p>
        <p className="text-sm">Escanea un producto para comenzar</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 p-6 border-t h-full flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Items:</span>
          <span className="font-medium">{getItemCount()}</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Descuento Global ({global_discount}%)</span>
            <span className="font-medium">Aplicar</span>
          </div>
          <Slider 
            value={[global_discount]} 
            onValueChange={(val) => setGlobalDiscount(val[0])} 
            max={100} 
            step={1} 
          />
        </div>

        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium">{getSubtotal()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">IVA ({taxRate}%)</span>
            <span className="font-medium">{getTaxAmount(taxRate)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex justify-between items-end border-t pt-4">
          <span className="text-lg font-bold text-gray-700">TOTAL</span>
          <span className="text-4xl font-black text-blue-700">{getTotal(taxRate)}</span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="lg" className="w-16 text-red-500 hover:bg-red-50" onClick={clearCart}>
            <Trash2 className="h-5 w-5" />
          </Button>
          <Button size="lg" className="flex-1 text-lg font-bold bg-green-600 hover:bg-green-700" onClick={onCheckout}>
            COBRAR
          </Button>
        </div>
      </div>
    </div>
  );
}
