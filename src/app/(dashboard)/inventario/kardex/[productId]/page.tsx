import { getKardexByProduct } from "@/lib/queries/kardex";
import { getProductById } from "@/lib/queries/products";
import { KardexTable } from "@/components/inventario/KardexTable";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function KardexProductoPage({ 
  params,
  searchParams
}: { 
  params: { productId: string },
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const page = typeof searchParams?.page === 'string' ? parseInt(searchParams.page) : 1;
  const dateFrom = typeof searchParams?.from === 'string' ? searchParams.from : undefined;
  const dateTo = typeof searchParams?.to === 'string' ? searchParams.to : undefined;

  const [{ product }, { data: kardex, count }] = await Promise.all([
    getProductById(params.productId),
    getKardexByProduct(params.productId, page, 50, dateFrom, dateTo)
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/inventario/productos/${params.productId}`}>
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Kardex de Movimientos</h1>
          <p className="text-gray-500">Producto: {product?.name}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <KardexTable data={kardex || []} totalCount={count || 0} currentPage={page} />
      </div>
    </div>
  );
}
