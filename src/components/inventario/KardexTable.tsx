'use client';

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/config/dinero";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function KardexTable({ data, totalCount, currentPage }: { data: any[], totalCount: number, currentPage: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(totalCount / 50);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(pathname + '?' + params.toString());
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'ENTRY': return 'bg-green-100 text-green-800 border-green-200';
      case 'EXIT': return 'bg-red-100 text-red-800 border-red-200';
      case 'ADJUSTMENT': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'RETURN': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Costo Unit.</TableHead>
              <TableHead className="text-right font-bold bg-slate-50">Saldo Cant.</TableHead>
              <TableHead className="text-right font-bold bg-slate-50">Saldo Valor</TableHead>
              <TableHead>Referencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap">
                  {new Date(row.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getBadgeColor(row.type)}>{row.type}</Badge>
                </TableCell>
                <TableCell className={`text-right font-medium ${['EXIT', 'ADJUSTMENT'].includes(row.type) ? 'text-red-600' : 'text-green-600'}`}>
                  {['EXIT', 'ADJUSTMENT'].includes(row.type) ? '-' : '+'}{row.quantity}
                </TableCell>
                <TableCell className="text-right text-gray-500">
                  {formatMoney(row.unit_cost)}
                </TableCell>
                <TableCell className="text-right font-bold bg-slate-50">{row.balance_quantity}</TableCell>
                <TableCell className="text-right font-bold bg-slate-50 text-blue-700">
                  {formatMoney(row.balance_value)}
                </TableCell>
                <TableCell className="text-sm text-gray-500 truncate max-w-[200px]" title={row.reference_doc || ''}>
                  {row.reference_doc || '-'}
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-gray-500">No hay movimientos registrados.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-500">Página {currentPage} de {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
