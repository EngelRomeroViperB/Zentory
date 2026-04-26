import { PurchaseForm } from "@/components/inventario/PurchaseForm";
import { getProducts } from "@/lib/queries/products";
import { createServerClient } from "@/lib/supabase-server";

export default async function NuevaCompraPage() {
  const productsResult = await getProducts();
  const supabase = await createServerClient();
  const { data: suppliers } = await supabase.from('suppliers').select('*');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Registrar Compra</h1>
        <p className="text-gray-500">Ingresa mercancía al inventario (crea lotes y actualiza Kardex).</p>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <PurchaseForm products={productsResult.data} suppliers={suppliers || []} />
      </div>
    </div>
  );
}
