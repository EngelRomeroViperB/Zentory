'use client';

import * as React from "react";
import { useCartStore } from "@/lib/store/cart.store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import dinero from "dinero.js";

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
  
  const subtotal = (Number(item.unit_price) * item.quantity) * (1 - item.discount_pct / 100);

  return (
    <div className="flex items-center justify-between p-3 border-b hover:bg-slate-50 transition-colors">
      <div className="flex-1">
        <div className="font-medium flex items-center gap-2">
          {item.name}
          {isLimit && <Badge variant="destructive" className="text-[10px] h-4">Stock Límite</Badge>}
        </div>
        <div className="text-sm text-gray-500">
          {dinero({ amount: Math.round(Number(item.unit_price) * 100), currency: 'USD' }).toFormat('$0,0.00')}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Desc.%</span>
          <Input 
            type="number" 
            className="w-16 h-8 text-center" 
            value={item.discount_pct} 
            onChange={(e) => updateDiscount(item.product_id, Number(e.target.value))}
            min={0} max={100}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Input 
            type="number" 
            className={`w-16 h-8 text-center font-bold ${isLimit ? 'border-red-500 text-red-600' : ''}`}
            value={item.quantity} 
            onChange={handleQuantityChange}
            min={1} max={item.current_stock}
          />
        </div>

        <div className="w-24 text-right font-bold text-blue-700">
          {dinero({ amount: Math.round(subtotal * 100), currency: 'USD' }).toFormat('$0,0.00')}
        </div>

        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeItem(item.product_id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
