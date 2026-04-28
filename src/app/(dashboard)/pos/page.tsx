import { getProducts } from "@/lib/queries/products";
import POSClient from "./POSClient";

export default async function POSPage() {
  const result = await getProducts(); // Obtener catálogo completo para escanear rápido

  return (
    <div className="h-[calc(100vh-6rem)] -m-4">
      <POSClient products={result.data || []} />
    </div>
  );
}
