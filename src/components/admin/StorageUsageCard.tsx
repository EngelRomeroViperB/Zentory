'use client';

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export function StorageUsageCard() {
  // Simularemos el cálculo de tamaño de BD (en un caso real se requiere query a pg_database_size)
  // Por restricciones de Supabase Free (500MB max)
  const [usedMB, setUsedMB] = React.useState(125); 
  const maxMB = 500;
  const percentage = (usedMB / maxMB) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Almacenamiento (Supabase Free)</CardTitle>
        <CardDescription>Uso del almacenamiento transaccional.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm font-medium mb-2">
            <span>{usedMB} MB usados</span>
            <span>{maxMB} MB totales</span>
          </div>
          <Progress value={percentage} className={`h-2 ${percentage > 80 ? 'bg-red-200' : ''}`} />
          <p className="text-xs text-gray-500 mt-2 text-right">{percentage.toFixed(1)}% utilizado</p>
        </div>

        {percentage > 80 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Capacidad al {percentage.toFixed(1)}%. Considera ejecutar el archivado manual o actualizar el plan.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
