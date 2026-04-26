'use client';

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Keyboard, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store/cart.store";
import { BarcodeCamera } from "./BarcodeCamera";

export function ProductScanner({ products }: { products: any[] }) {
  const [barcode, setBarcode] = React.useState("");
  const [showCamera, setShowCamera] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const addItem = useCartStore((state) => state.addItem);

  // Mantener el foco
  React.useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) inputRef.current.focus();
    };
    focusInput();
    window.addEventListener("click", focusInput);
    return () => window.removeEventListener("click", focusInput);
  }, []);

  const handleAddByCode = (code: string) => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    const product = products.find(p => p.code_qr_bar === trimmedCode);
    if (product) {
      try {
        addItem(product);
        toast.success(`Agregado: ${product.name}`);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Error al agregar producto";
        toast.error(errorMsg);
      }
    } else {
      toast.error("Producto no encontrado");
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddByCode(barcode);
      setBarcode("");
    }
  };

  const handleCameraScan = (code: string) => {
    handleAddByCode(code);
    setShowCamera(false);
  };

  return (
    <div className="flex gap-2 w-full relative">
      <div className="absolute left-3 top-3 text-gray-400">
        <Keyboard className="h-4 w-4" />
      </div>
      <Input
        ref={inputRef}
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escanear código de barras o ingresar manualmente..."
        className="pl-10 h-10 w-full bg-slate-50 focus-visible:ring-blue-500"
      />
      <Badge variant="outline" className="absolute right-12 top-2 bg-white">HID Activo</Badge>
      <Button 
        variant="outline" 
        size="icon" 
        title="Usar Cámara"
        onClick={() => setShowCamera(true)}
      >
        <Camera className="h-4 w-4" />
      </Button>

      {showCamera && (
        <BarcodeCamera
          onScan={handleCameraScan}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
