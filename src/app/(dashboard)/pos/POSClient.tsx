'use client';

import * as React from "react";
import { ProductScanner } from "@/components/pos/ProductScanner";
import { CartItemRow } from "@/components/pos/CartItem";
import { CartSummary } from "@/components/pos/CartSummary";
import { CheckoutDialog } from "@/components/pos/CheckoutDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCartStore } from "@/lib/store/cart.store";

export default function POSClient({ products }: { products: any[] }) {
  const { items } = useCartStore();
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-slate-100">
      
      {/* Panel Izquierdo: Buscador y Lista de Items */}
      <div className="flex-1 flex flex-col h-full bg-white border-r">
        <div className="p-4 border-b bg-white z-10 shadow-sm">
          <ProductScanner products={products} />
        </div>
        
        <ScrollArea className="flex-1 p-0">
          <div className="divide-y">
            {items.map(item => (
              <CartItemRow key={item.product_id} item={item} />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Panel Derecho: Resumen y Pago */}
      <div className="w-full md:w-[400px] h-full bg-white flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
        <CartSummary onCheckout={() => setCheckoutOpen(true)} />
      </div>

      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />

    </div>
  );
}
