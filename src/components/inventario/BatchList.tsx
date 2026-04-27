'use client';

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { BatchForm } from "./BatchForm";
import { Plus } from "lucide-react";
import { differenceInDays } from "date-fns";
import dinero from "dinero.js";

export function BatchList({ batches, productId }: { batches: any[], productId: string }) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleSuccess = () => {
    setIsModalOpen(false);
    // Recargar la página para mostrar el nuevo lote
    window.location.reload();
  };

  return (
    <div className="space-y-4 border rounded-lg p-6 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Lotes y Ubicaciones</h3>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Agregar Lote
        </Button>
      </div>

      <Dialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      >
        <BatchForm
          productId={productId}
          onSuccess={handleSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lote</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead className="text-right">Costo Unit.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch) => {
            const daysLeft = batch.expiry_date ? differenceInDays(new Date(batch.expiry_date), new Date()) : null;
            const isExpiring = daysLeft !== null && daysLeft <= 7;
            const isExpired = daysLeft !== null && daysLeft < 0;

            return (
              <TableRow key={batch.id}>
                <TableCell className="font-medium">{batch.batch_code || 'N/A'}</TableCell>
                <TableCell>{batch.location || '-'}</TableCell>
                <TableCell>
                  {batch.expiry_date ? (
                    <div className="flex items-center gap-2">
                      <span>{new Date(batch.expiry_date).toLocaleDateString()}</span>
                      {isExpired ? (
                        <Badge variant="destructive">Vencido</Badge>
                      ) : isExpiring ? (
                        <Badge variant="destructive">Próximo ({daysLeft} d)</Badge>
                      ) : null}
                    </div>
                  ) : 'Sin fecha'}
                </TableCell>
                <TableCell className="text-right font-bold">{batch.quantity}</TableCell>
                <TableCell className="text-right text-gray-500">
                  {batch.unit_cost ? dinero({ amount: Math.round(Number(batch.unit_cost) * 100), currency: 'USD' }).toFormat('$0,0.00') : '-'}
                </TableCell>
              </TableRow>
            )
          })}
          {batches.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24 text-gray-500">No hay lotes activos</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
