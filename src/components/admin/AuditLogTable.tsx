'use client';

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function AuditLogTable({ logs }: { logs: any[] }) {
  
  const getActionBadge = (action: string) => {
    switch(action) {
      case 'INSERT': return <Badge variant="outline" className="bg-green-50 text-green-700">INSERT</Badge>;
      case 'UPDATE': return <Badge variant="outline" className="bg-blue-50 text-blue-700">UPDATE</Badge>;
      case 'DELETE': return <Badge variant="outline" className="bg-red-50 text-red-700">DELETE</Badge>;
      default: return <Badge>{action}</Badge>;
    }
  }

  const renderSummary = (log: any) => {
    // Si es delete o anulación
    if (log.action === 'DELETE' || (log.action === 'UPDATE' && log.new_data?.status === 'DELETED')) {
      return <span className="text-red-600 font-medium">Registro eliminado/anulado.</span>;
    }
    // Si es cambio de precio en producto
    if (log.table_name === 'products' && log.old_data) {
      return `Precio modificado: $${log.old_data.sale_price} -> $${log.new_data.sale_price}`;
    }
    // Si es rol
    if (log.table_name === 'user_roles') {
      return `Rol asignado: ${log.new_data?.role}`;
    }

    return "Modificación general";
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Acción</TableHead>
            <TableHead>Tabla</TableHead>
            <TableHead>Resumen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map(log => (
            <TableRow key={log.id}>
              <TableCell className="whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</TableCell>
              <TableCell>{log.user_email || 'Sistema'}</TableCell>
              <TableCell>{getActionBadge(log.action)}</TableCell>
              <TableCell className="font-mono text-xs">{log.table_name}</TableCell>
              <TableCell className="text-sm text-gray-600">{renderSummary(log)}</TableCell>
            </TableRow>
          ))}
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                No hay registros de auditoría recientes.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
