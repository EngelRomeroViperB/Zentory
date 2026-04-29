'use client';

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Tag, Box } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCartStore } from "@/lib/store/cart.store";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/config/dinero";

interface ProductGridProps {
  products: any[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  const categories = React.useMemo(() => {
    const cats = new Set(products.map(p => p.categories?.name).filter(Boolean));
    return Array.from(cats);
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                           p.code_qr_bar?.includes(search);
      const matchesCategory = !selectedCategory || p.categories?.name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search and Filters */}
      <div className="space-y-4 px-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/50 border-slate-200 focus:bg-white transition-all shadow-sm rounded-xl h-11"
          />
        </div>
        
        <ScrollArea className="w-full pb-2" orientation="horizontal">
          <div className="flex gap-2">
            <Badge 
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap px-4 py-1.5 rounded-full transition-all hover:scale-105"
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Badge>
            {categories.map(cat => (
              <Badge 
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap px-4 py-1.5 rounded-full transition-all hover:scale-105"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Grid */}
      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id}
              className={cn(
                "group relative overflow-hidden cursor-pointer border-none shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white",
                product.current_stock <= 0 && "opacity-60 grayscale"
              )}
              onClick={() => product.current_stock > 0 && addItem(product)}
            >
              <div className="aspect-square bg-slate-50 flex items-center justify-center p-6 transition-colors group-hover:bg-indigo-50/50">
                <div className="relative">
                   <Box className="h-12 w-12 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                   {product.current_stock <= product.min_stock && (
                     <Badge className="absolute -top-2 -right-2 bg-amber-500 hover:bg-amber-500 border-none px-1.5 min-w-[1.2rem] h-5">
                       !
                     </Badge>
                   )}
                </div>
              </div>
              
              <div className="p-3 space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                  <Tag className="h-2.5 w-2.5" />
                  {product.categories?.name || 'Gral'}
                </div>
                <h3 className="font-semibold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-indigo-600">
                    {formatMoney(product.sale_price)}
                  </span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-md font-medium",
                    product.current_stock > product.min_stock 
                      ? "bg-green-50 text-green-600" 
                      : "bg-red-50 text-red-600"
                  )}>
                    Stock: {product.current_stock}
                  </span>
                </div>
              </div>

              {/* Add hint */}
              <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                  + AGREGAR
                </span>
              </div>
            </Card>
          ))}
          
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center space-y-3">
              <div className="inline-flex p-4 rounded-full bg-slate-50 text-slate-300">
                <Search className="h-8 w-8" />
              </div>
              <p className="text-slate-400 font-medium italic">No se encontraron productos...</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
