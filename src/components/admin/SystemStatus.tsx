'use client';

import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

export function SystemStatus() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(() => setStatus({ status: 'down', checks: { database: 'error', env_vars: 'missing' } }));
  }, []);

  const getBadgeColor = (state: string) => {
    switch (state) {
      case 'ok': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'down': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const Icon = status?.status === 'ok' ? CheckCircle2 : status?.status === 'degraded' ? AlertCircle : XCircle;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Health Check</CardTitle>
            <CardDescription>Estado de los servicios de la plataforma.</CardDescription>
          </div>
          <Badge variant="outline" className={getBadgeColor(status?.status)}>
            {status?.status?.toUpperCase() || 'LOADING...'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {status ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-500">Conexión a Base de Datos</span>
              <span className={`font-medium ${status.checks.database === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                {status.checks.database === 'ok' ? 'Conectado' : 'Fallando'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-500">Variables de Entorno</span>
              <span className={`font-medium ${status.checks.env_vars === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                {status.checks.env_vars === 'ok' ? 'Configuradas' : 'Incompletas'}
              </span>
            </div>
            <p className="text-xs text-gray-400 text-right mt-2">Versión: {status.version || '1.0.0'}</p>
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center text-gray-400">Verificando estado...</div>
        )}
      </CardContent>
    </Card>
  );
}
