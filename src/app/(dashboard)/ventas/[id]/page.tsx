import { getSaleById } from "@/lib/queries/sales";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import dinero from "dinero.js";

// Import Client Component interactivo para anular si es admin
import { VoidSaleButton } from "./VoidSaleButton";

export default async function SaleDetailPage({ params }: { params: { id: string } }) {
  const { sale, items } = await getSaleById(params.id);

  if (!sale) return <div>Venta no encontrada</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ventas">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              Factura: {sale.invoice_number}
              <Badge variant={sale.status === 'ACTIVE' ? 'default' : 'destructive'}>
                {sale.status === 'ACTIVE' ? 'ACTIVA' : 'ANULADA'}
              </Badge>
            </h1>
            <p className="text-gray-500">{new Date(sale.created_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {sale.status === 'ACTIVE' && (
            <VoidSaleButton saleId={sale.id} invoice={sale.invoice_number} />
          )}
          <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Re-Imprimir PDF</Button>
        </div>
      </div>

      {sale.status === 'DELETED' && sale.notes && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
          <strong>Motivo de anulación:</strong> {sale.notes.split('| ANULADA:')[1]}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Datos del Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-lg">{sale.client_name || 'Cliente Ocasional'}</p>
            {sale.client_nit && <p className="text-sm">NIT: {sale.client_nit}</p>}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Datos de la Venta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold">Vendedor: {sale.vendedor_email}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de Ítems</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Precio Unit.</TableHead>
                <TableHead className="text-right">Descuento</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.products?.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {dinero({ amount: Math.round(Number(item.unit_price) * 100), currency: 'USD' }).toFormat('$0,0.00')}
                  </TableCell>
                  <TableCell className="text-right">{item.discount_pct}%</TableCell>
                  <TableCell className="text-right font-medium">
                    {dinero({ amount: Math.round(Number(item.subtotal) * 100), currency: 'USD' }).toFormat('$0,0.00')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{dinero({ amount: Math.round((Number(sale.total) - Number(sale.tax_amount)) * 100), currency: 'USD' }).toFormat('$0,0.00')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">IVA</span>
                <span>{dinero({ amount: Math.round(Number(sale.tax_amount) * 100), currency: 'USD' }).toFormat('$0,0.00')}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>TOTAL</span>
                <span>{dinero({ amount: Math.round(Number(sale.total) * 100), currency: 'USD' }).toFormat('$0,0.00')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
