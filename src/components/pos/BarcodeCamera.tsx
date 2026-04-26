'use client';

import * as React from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { X, ScanLine } from "lucide-react";

interface BarcodeCameraProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function BarcodeCamera({ onScan, onClose }: BarcodeCameraProps) {
  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);

  React.useEffect(() => {
    const startScanner = async () => {
      try {
        // Verificar si el navegador soporta getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError("Tu navegador no soporta acceso a cámara");
          return;
        }

        // Verificar permisos
        const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (permissions.state === 'denied') {
          setError("Permiso de cámara denegado. Por favor habilita el acceso en la configuración de tu navegador.");
          return;
        }

        // Inicializar scanner
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 150 }, // Rectangular para códigos de barras
          aspectRatio: 1.0,
        };

        await scanner.start(
          { facingMode: "environment" }, // Usar cámara trasera
          config,
          (decodedText) => {
            // Éxito al escanear
            onScan(decodedText);
            stopScanner();
          },
          () => {
            // Error de escaneo (ignorar, es normal mientras no hay código)
          }
        );

        setIsScanning(true);
      } catch (err) {
        console.error("Error iniciando scanner:", err);
        setError("Error al iniciar la cámara. Asegúrate de usar HTTPS y permitir acceso.");
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [onScan]);

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        // Ignorar error si ya estaba detenido
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <ScanLine className="h-6 w-6" />
            <h2 className="text-lg font-semibold">Escanear Código</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={stopScanner}
            className="text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 p-4 rounded-lg text-center">
            <p className="font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="mt-2 border-red-400 text-red-100 hover:bg-red-500/20"
            >
              Cerrar
            </Button>
          </div>
        )}

        {/* Scanner */}
        {!error && (
          <>
            <div className="relative bg-black rounded-lg overflow-hidden">
              <div id="qr-reader" className="w-full" style={{ minHeight: '300px' }} />
              
              {/* Overlay de guía */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-32 border-2 border-blue-400 rounded-lg">
                  {/* Esquinas */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-blue-500" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-blue-500" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-blue-500" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-blue-500" />
                </div>
              </div>
            </div>

            <p className="text-center text-gray-400 text-sm">
              Apunta la cámara al código de barras o QR del producto
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={stopScanner}
                className="flex-1 bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                Cancelar
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
