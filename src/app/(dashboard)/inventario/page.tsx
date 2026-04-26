import { getLowStockProducts, getExpiringBatches, getInventoryValuation } from "@/lib/queries/alerts";
import { LowStockAlert, ExpiringBatchesAlert } from "@/components/inventario/Alerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dinero from "dinero.js";

export default async function DashboardInventarioPage() {
  const [lowStock, expiring, valuation] = await Promise.all([
    getLowStockProducts(),
    getExpiringBatches(),
    getInventoryValuation()
  ]);

  const totalValue = valuation.reduce((acc, item) => acc + Number(item.total_value), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard de Inventario</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <LowStockAlert items={lowStock} />
        <ExpiringBatchesAlert items={expiring} />
        
        <Card className="bg-slate-900 text-white">
          <CardHeader>
            <CardTitle className="text-slate-200">Valor Total del Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {dinero({ amount: Math.round(totalValue * 100), currency: 'USD' }).toFormat('$0,0.00')}
            </div>
            <p className="text-slate-400 mt-2 text-sm">Costo total ponderado</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 10 Productos por Valor (Valuación)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {valuation.slice(0,10).map((v, i) => (
              <div key={v.id} className="flex justify-between items-center border-b pb-2">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{i + 1}</Badge>
                  <div>
                    <p className="font-medium">{v.name}</p>
                    <p className="text-sm text-gray-500">Stock: {v.current_stock} | Categoría: {v.category_name}</p>
                  </div>
                </div>
                <div className="font-bold">
                  {dinero({ amount: Math.round(Number(v.total_value) * 100), currency: 'USD' }).toFormat('$0,0.00')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
