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

  if (items.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Descuento Global */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descuento Global</span>
            <span className="text-sm font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-lg shadow-sm border border-slate-100">
               {global_discount}%
            </span>
          </div>
          <Slider 
            value={[global_discount]} 
            onValueChange={(val) => setGlobalDiscount(val[0])} 
            max={100} 
            step={1}
            className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-indigo-600 [&_[role=slider]]:border-white"
          />
        </div>

        {/* Totales */}
        <div className="px-1 space-y-2.5">
          <div className="flex justify-between items-center text-sm font-medium text-slate-500">
            <span>Subtotal</span>
            <span className="text-slate-700 font-bold">{getSubtotal()}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-medium text-slate-500">
            <span>Impuestos ({taxRate}%)</span>
            <span className="text-slate-700 font-bold">{getTaxAmount(taxRate)}</span>
          </div>
          <div className="pt-4 flex justify-between items-end border-t border-slate-100">
            <span className="text-xs font-black text-slate-400 uppercase tracking-tighter mb-1">Total a Pagar</span>
            <span className="text-4xl font-black text-slate-900 tracking-tight">
               {getTotal(taxRate)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-14 w-14 shrink-0 rounded-2xl border-2 border-red-50 text-red-500 hover:bg-red-50 hover:border-red-100 transition-all"
          onClick={clearCart}
          title="Vaciar Carrito"
        >
          <Trash2 className="h-6 w-6" />
        </Button>
        <Button 
          size="lg" 
          className="flex-1 h-14 rounded-2xl text-lg font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all hover:scale-[1.02] active:scale-95"
          onClick={onCheckout}
        >
          FINALIZAR VENTA
        </Button>
      </div>
    </div>
  );
}
