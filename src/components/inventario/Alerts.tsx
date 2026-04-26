'use client';

import * as React from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function LowStockAlert({ items }: { items: any[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Stock Bajo
        </CardTitle>
        <Badge variant="destructive">{items.length}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.slice(0,5).map(item => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <Link href={`/inventario/productos/${item.id}`} className="hover:underline font-medium">
                {item.name}
              </Link>
              <span className="text-red-500 font-bold">{item.current_stock} / {item.min_stock}</span>
            </div>
          ))}
          {items.length === 0 && <span className="text-sm text-gray-500">No hay alertas.</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export function ExpiringBatchesAlert({ items }: { items: any[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-red-500" />
          Lotes por vencer
        </CardTitle>
        <Badge variant="destructive">{items.length}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.slice(0,5).map(item => (
            <div key={item.batch_id} className="flex justify-between items-center text-sm">
              <div className="flex flex-col">
                <Link href={`/inventario/productos/${item.product_id}`} className="hover:underline font-medium">
                  {item.product_name}
                </Link>
                <span className="text-xs text-gray-500">Lote: {item.batch_code || 'N/A'}</span>
              </div>
              <span className="text-red-500 font-bold">
                {new Date(item.expiry_date).toLocaleDateString()}
              </span>
            </div>
          ))}
          {items.length === 0 && <span className="text-sm text-gray-500">No hay alertas.</span>}
        </div>
      </CardContent>
    </Card>
  );
}
