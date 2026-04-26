import { getProductById } from "@/lib/queries/products";
import { ProductForm } from "@/components/inventario/ProductForm";
import { getCategories } from "@/lib/queries/products";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditarProductoPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const [{ product }, categories] = await Promise.all([
    getProductById(params.id),
    getCategories()
  ]);

  if (!product) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Producto no encontrado</h1>
        <Link href="/inventario/productos">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/inventario/productos/${params.id}`}>
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Producto</h1>
          <p className="text-gray-500">{product.name}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <ProductForm initialData={product} categories={categories} />
      </div>
    </div>
  );
}
