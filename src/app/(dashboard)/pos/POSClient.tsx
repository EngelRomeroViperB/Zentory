'use client';

import * as React from "react";
import { ProductScanner } from "@/components/pos/ProductScanner";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartItemRow } from "@/components/pos/CartItem";
import { CartSummary } from "@/components/pos/CartSummary";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCartStore } from "@/lib/store/cart.store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, SearchCode, Boxes } from "lucide-react";

import { CheckoutDialog } from "@/components/pos/CheckoutDialog";

export default function POSClient({ products }: { products: any[] }) {
  const { items } = useCartStore();
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-[#f8fafc] overflow-hidden">
      
      {/* Panel Izquierdo: Buscador, Grid y Lista de Items */}
      <div className="flex-1 flex flex-col h-full bg-white md:rounded-r-3xl shadow-xl z-10 overflow-hidden">
        
        <Tabs defaultValue="grid" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">Zentory <span className="text-indigo-600">POS</span></h1>
            </div>
            
            <TabsList className="bg-slate-100/80 p-1 rounded-xl h-11">
              <TabsTrigger value="grid" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Boxes className="h-4 w-4 mr-2" /> Catálogo
              </TabsTrigger>
              <TabsTrigger value="scanner" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <SearchCode className="h-4 w-4 mr-2" /> Scanner
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <TabsContent value="grid" className="h-full m-0 p-6 focus-visible:outline-none focus-visible:ring-0">
              <ProductGrid products={products} />
            </TabsContent>
            
            <TabsContent value="scanner" className="h-full m-0 p-6 focus-visible:outline-none focus-visible:ring-0 space-y-6">
              <div className="max-w-2xl mx-auto space-y-8 pt-10">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-slate-800">Modo Escáner</h2>
                  <p className="text-slate-500 font-medium">Usa tu lector HID o la cámara para agregar productos rápidamente.</p>
                </div>
                <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-colors shadow-sm">
                  <ProductScanner products={products} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-center text-sm font-semibold">
                    Foco automático activo
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-center text-sm font-semibold">
                    Compatible con EAN/QR
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Panel Derecho: Carrito y Resumen */}
      <div className="w-full md:w-[450px] h-full flex flex-col bg-[#f8fafc] z-0">
        <div className="p-6 pb-2 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            Carrito de Venta 
            <span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
            </span>
          </h2>
        </div>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-3 py-4 pb-10">
            {items.map(item => (
              <CartItemRow key={item.product_id} item={item} />
            ))}
            {items.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
                 <div className="p-4 bg-slate-100 rounded-full text-slate-400">
                    <ShoppingBag className="h-8 w-8" />
                 </div>
                 <div className="space-y-1">
                    <p className="font-bold text-slate-500">Carrito vacío</p>
                    <p className="text-xs text-slate-400">Agrega productos del catálogo para comenzar.</p>
                 </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 bg-white border-t border-slate-100 md:rounded-t-[2.5rem] shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.1)]">
           <CartSummary onCheckout={() => setCheckoutOpen(true)} />
        </div>
      </div>

      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  );
}
