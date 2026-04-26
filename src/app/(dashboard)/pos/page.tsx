import { getProducts } from "@/lib/queries/products";
import { ProductScanner } from "@/components/pos/ProductScanner";
import { CartItemRow } from "@/components/pos/CartItem";
import { CartSummary } from "@/components/pos/CartSummary";
import { CheckoutDialog } from "@/components/pos/CheckoutDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCartStore } from "@/lib/store/cart.store";
import { useState } from "react";

// Como necesitamos Zustand, dividimos en un Client Component wrapper
import POSClient from "./POSClient";

export default async function POSPage() {
  const products = await getProducts(); // Obtener catálogo completo para escanear rápido

  return (
    <div className="h-[calc(100vh-6rem)] -m-4">
      <POSClient products={products || []} />
    </div>
  );
}
