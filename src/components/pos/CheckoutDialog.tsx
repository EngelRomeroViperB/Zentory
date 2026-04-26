'use client';

import * as React from "react";
import { useCartStore } from "@/lib/store/cart.store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { completeSale } from "@/lib/actions/sales";
import { toast } from "sonner";
import { CheckCircle2, Printer, Download } from "lucide-react";
import { generateInvoicePDF } from "@/lib/pdf/invoice.template";

export function CheckoutDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
  const { items, clearCart, client_id, client_name, getTotal, getSubtotal, getTaxAmount } = useCartStore();
  const [tab, setTab] = React.useState("confirm");
  const [loading, setLoading] = React.useState(false);
  const [saleResult, setSaleResult] = React.useState<{id: string, invoice: string} | null>(null);

  const taxRate = Number(process.env.NEXT_PUBLIC_DEFAULT_TAX_RATE || 19);

  const handleComplete = async () => {
    setLoading(true);
    const deviceId = localStorage.getItem('bridge_device_id') || undefined;

    const payload = {
      client_id: client_id,
      tax_rate: taxRate,
      notes: "Venta desde POS",
      items: items.map(i => ({
        product_id: i.product_id,
        batch_id: i.batch_id || undefined,
        quantity: i.quantity,
        unit_price: i.unit_price,
        unit_cost: i.unit_cost,
        discount_pct: i.discount_pct,
        tax_rate: taxRate
      }))
    };

    const res = await completeSale(payload, deviceId);
    setLoading(false);

    if (res.success) {
      setSaleResult({ id: res.sale_id!, invoice: res.invoice_number! });
      setTab("result");
      clearCart();
    } else {
      toast.error(res.error || "Error procesando la venta");
    }
  };

  const handlePrint = async () => {
    if (!saleResult) return;
    // Lógica opcional para generar PDF localmente y abrirlo
    const data = {
      invoice_number: saleResult.invoice,
      created_at: new Date().toISOString(),
      client_name: client_name || "Ocasional",
      client_nit: null,
      vendedor: "Vendedor actual",
      items: items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount_pct: i.discount_pct,
        subtotal: (Number(i.unit_price) * i.quantity * (1 - i.discount_pct/100)).toString()
      })),
      subtotal: getSubtotal().replace(/[^0-9.-]+/g,""),
      tax_amount: getTaxAmount(taxRate).replace(/[^0-9.-]+/g,""),
      total: getTotal(taxRate).replace(/[^0-9.-]+/g,""),
      notes: ""
    };
    const pdf = await generateInvoicePDF(data);
    pdf.autoPrint();
    window.open(pdf.output('bloburl'), '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading && tab !== "result") onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[500px]">
        <Tabs value={tab}>
          <TabsList className="grid w-full grid-cols-2 hidden">
            <TabsTrigger value="confirm">Confirmar</TabsTrigger>
            <TabsTrigger value="result">Resultado</TabsTrigger>
          </TabsList>

          <TabsContent value="confirm" className="space-y-6">
            <DialogHeader>
              <DialogTitle>Confirmar Venta</DialogTitle>
              <DialogDescription>Revisa los datos antes de procesar el pago.</DialogDescription>
            </DialogHeader>

            <div className="bg-slate-50 p-4 rounded-md border">
              <div className="flex justify-between mb-2 pb-2 border-b">
                <span className="font-medium">Cliente:</span>
                <span className="text-blue-600 font-bold">{client_name || "Cliente Ocasional"}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{getSubtotal()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">IVA ({taxRate}%)</span>
                  <span>{getTaxAmount(taxRate)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                  <span>TOTAL A COBRAR</span>
                  <span>{getTotal(taxRate)}</span>
                </div>
              </div>
            </div>

            <Button size="lg" className="w-full text-lg font-bold" onClick={handleComplete} disabled={loading}>
              {loading ? "Procesando..." : "Confirmar Venta"}
            </Button>
          </TabsContent>

          <TabsContent value="result" className="space-y-6 text-center py-6">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-20 w-20 text-green-500" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">¡Venta Exitosa!</DialogTitle>
              <DialogDescription className="text-center text-lg mt-2 font-medium">
                Factura: <span className="text-blue-600">{saleResult?.invoice}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-4 justify-center mt-6">
              <Button onClick={handlePrint} variant="outline" className="w-full flex items-center justify-center gap-2">
                <Printer className="h-4 w-4" /> Imprimir
              </Button>
            </div>

            <Button size="lg" className="w-full mt-4" onClick={() => { setTab("confirm"); onOpenChange(false); }}>
              Nueva Venta
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
