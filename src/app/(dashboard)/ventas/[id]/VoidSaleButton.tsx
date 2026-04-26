'use client';

import * as React from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { voidSale } from "@/lib/actions/sales";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase";
import { XCircle } from "lucide-react";

export function VoidSaleButton({ saleId, invoice }: { saleId: string, invoice: string }) {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const checkRole = async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase.rpc('get_my_role');
      setIsAdmin(data === 'admin');
    };
    checkRole();
  }, []);

  const handleVoid = async (e: React.MouseEvent) => {
    e.preventDefault(); // Evitar cerrar modal nativamente
    if (reason.length < 10) {
      toast.error("El motivo debe tener al menos 10 caracteres");
      return;
    }
    
    const res = await voidSale(saleId, reason);
    if (res.success) {
      toast.success("Venta anulada correctamente");
      setOpen(false);
    } else {
      toast.error(res.error || "Error al anular la venta");
    }
  };

  if (!isAdmin) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive"><XCircle className="mr-2 h-4 w-4" /> Anular Venta</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está seguro de anular la factura {invoice}?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción es irreversible. El inventario será devuelto al Kardex como un movimiento de retorno (RETURN) y la venta cambiará a estado anulado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="my-4">
          <label className="text-sm font-medium mb-2 block text-gray-700">Motivo de la anulación (obligatorio):</label>
          <Textarea 
            placeholder="Ej: Cliente devolvió el producto porque estaba defectuoso..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full"
            rows={3}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button variant="destructive" onClick={handleVoid}>Confirmar Anulación</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
