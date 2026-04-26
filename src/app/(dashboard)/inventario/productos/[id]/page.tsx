import { getProductById } from "@/lib/queries/products";
import { BatchList } from "@/components/inventario/BatchList";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Edit, ListOrdered } from "lucide-react";
import dinero from "dinero.js";

export default async function DetalleProductoPage({ params }: { params: { id: string } }) {
  const { product, batches } = await getProductById(params.id);

  if (!product) return <div>Producto no encontrado</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inventario/productos">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {product.name}
              <Badge variant="outline">{product.code_qr_bar}</Badge>
            </h1>
            <p className="text-gray-500">{product.categories?.name || 'Sin categoría'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/inventario/kardex/${product.id}`}>
            <Button variant="outline"><ListOrdered className="mr-2 h-4 w-4" /> Ver Kardex</Button>
          </Link>
          <Link href={`/inventario/productos/${product.id}/editar`}>
            <Button><Edit className="mr-2 h-4 w-4" /> Editar</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1 border rounded-lg p-6 bg-white shadow-sm space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Resumen</h3>
          <div>
            <p className="text-sm text-gray-500">Stock Actual</p>
            <p className="text-2xl font-bold">{product.current_stock}</p>
            <p className="text-xs text-gray-500 mt-1">Mínimo: {product.min_stock}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Costo Promedio</p>
            <p className="text-xl font-bold">
              {dinero({ amount: Math.round(Number(product.cost_price) * 100), currency: 'USD' }).toFormat('$0,0.00')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Precio Venta</p>
            <p className="text-xl font-bold">
              {dinero({ amount: Math.round(Number(product.sale_price) * 100), currency: 'USD' }).toFormat('$0,0.00')}
            </p>
          </div>
        </div>

        <div className="col-span-3">
          <BatchList batches={batches} productId={product.id} />
        </div>
      </div>
    </div>
  );
}
