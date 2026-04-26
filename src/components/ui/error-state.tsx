import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = "Error al cargar", 
  description = "Ocurrió un problema al obtener los datos. Por favor intenta nuevamente.",
  onRetry
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center border border-red-200 rounded-lg bg-red-50">
      <div className="p-4 bg-red-100 rounded-full">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-red-900">{title}</h3>
        <p className="text-red-600 max-w-sm">{description}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="border-red-300 hover:bg-red-100">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Intentar nuevamente
        </Button>
      )}
    </div>
  );
}
