'use client';

import * as React from "react";
import { useCartStore } from "@/lib/store/cart.store";
import { Button } from "@/components/ui/button";
import { Trash2, Box } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { fromDBString, formatMoney } from "@/lib/config/dinero";

export function CartItemRow({ item }: { item: any }) {
  const { updateQuantity, updateDiscount, removeItem } = useCartStore();

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
      try {
        updateQuantity(item.product_id, val);
      } catch (err: any) {
        // Ignorar o mostrar toast
      }
    }
  };

  const isLimit = item.quantity >= item.current_stock;
  
  // Cálculo de subtotal con Dinero.js
  const subtotalDinero = fromDBString(item.unit_price)
    .multiply(item.quantity)
    .multiply(100 - item.discount_pct)
    .divide(100);

  return (
    <Card className="group border-none shadow-sm hover:shadow-md transition-all duration-200 bg-white overflow-hidden p-3 ring-1 ring-slate-100 hover:ring-indigo-100">
      <div className="flex gap-3">
        {/* Representación visual */}
        <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
          <Box className="h-6 w-6 text-slate-300 group-hover:text-indigo-400 transition-colors" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
             <h3 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
               {item.name}
             </h3>
             <button 
               onClick={() => removeItem(item.product_id)}
               className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
             >
               <Trash2 className="h-4 w-4" />
             </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                  {formatMoney(item.unit_price)}
               </span>
               {isLimit && <Badge className="bg-amber-100 text-amber-600 border-none hover:bg-amber-100 text-[9px] h-4 px-1.5">MÁX</Badge>}
            </div>
            
            <div className="flex items-center gap-1.5">
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="h-6 w-6 rounded-md hover:bg-slate-100"
                 onClick={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
               >
                 -
               </Button>
               <input 
                 type="number"
                 value={item.quantity}
                 onChange={handleQuantityChange}
                 className="w-10 text-center font-black text-slate-700 text-sm bg-transparent focus:outline-none"
               />
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="h-6 w-6 rounded-md hover:bg-slate-100"
                 disabled={isLimit}
                 onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
               >
                 +
               </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Barra de subtotal */}
      <div className="mt-3 pt-2 border-t border-slate-50 flex justify-between items-center">
         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Subtotal</span>
         <span className="text-sm font-black text-slate-900 tracking-tight">
            {subtotalDinero.toFormat('$0,0.00')}
         </span>
      </div>
    </Card>
  );
}
