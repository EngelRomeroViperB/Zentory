import { getCategories } from "@/lib/queries/products";
import { ProductForm } from "@/components/inventario/ProductForm";

export default async function NuevoProductoPage() {
  const categories = await getCategories();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Producto</h1>
        <p className="text-gray-500">Agrega un nuevo producto al catálogo.</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
