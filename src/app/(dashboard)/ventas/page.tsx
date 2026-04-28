import { getSales } from "@/lib/queries/sales";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/config/dinero";

export default async function VentasPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const page = typeof searchParams?.page === 'string' ? parseInt(searchParams.page) : 1;
  
  const { data: sales, count } = await getSales(page, 50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Listado de Ventas</h1>
          <p className="text-gray-500">Historial de facturas y anulaciones.</p>
        </div>
        <Link href="/pos">
          <Button>Ir al POS</Button>
        </Link>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factura</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales?.map((sale) => (
              <TableRow key={sale.id} className={sale.status === 'DELETED' ? 'bg-slate-50' : ''}>
                <TableCell className="font-medium">
                  {sale.status === 'DELETED' ? (
                    <span className="line-through text-gray-400">{sale.invoice_number}</span>
                  ) : sale.invoice_number}
                </TableCell>
                <TableCell>{new Date(sale.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{sale.client_name || 'Ocasional'}</TableCell>
                <TableCell>{sale.vendedor_email}</TableCell>
                <TableCell className="text-center">{sale.item_count}</TableCell>
                <TableCell className="text-right font-bold">
                  {formatMoney(sale.total)}
                </TableCell>
                <TableCell>
                  <Badge variant={sale.status === 'ACTIVE' ? 'default' : 'destructive'}>
                    {sale.status === 'ACTIVE' ? 'ACTIVA' : 'ANULADA'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/ventas/${sale.id}`}>
                    <Button variant="outline" size="sm">Ver</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
