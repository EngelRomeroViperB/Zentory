'use client';

import * as React from "react";
import { ExportBar } from "../ExportBar";
import { formatMoney, generateReportPDF } from "@/lib/exports/pdf.utils";
import { generateReportExcel } from "@/lib/exports/excel.utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export function SalesByDateReport({ data }: { data: any[] }) {
  // Configuración para PDF
  const handleExportPDF = () => {
    generateReportPDF({
      title: "Reporte de Ventas por Fecha",
      subtitle: "Ingresos diarios",
      dateRange: null, // Si tuviéramos estado de fechas
      columns: [
        { header: "Fecha", dataKey: "fecha" },
        { header: "Facturas", dataKey: "num_facturas" },
        { header: "Subtotal", dataKey: "subtotal" },
        { header: "IVA", dataKey: "iva" },
        { header: "Total", dataKey: "total" }
      ],
      data: data.map(d => ({
        ...d,
        fecha: new Date(d.fecha).toLocaleDateString(),
        subtotal: formatMoney(d.subtotal),
        iva: formatMoney(d.iva),
        total: formatMoney(d.total)
      })),
      totalsRow: {
        fecha: "TOTAL",
        num_facturas: data.reduce((a,b) => a + Number(b.num_facturas), 0),
        subtotal: formatMoney(data.reduce((a,b) => a + Number(b.subtotal), 0)),
        iva: formatMoney(data.reduce((a,b) => a + Number(b.iva), 0)),
        total: formatMoney(data.reduce((a,b) => a + Number(b.total), 0))
      },
      businessInfo: {
        name: process.env.NEXT_PUBLIC_BUSINESS_NAME || "",
        nit: process.env.NEXT_PUBLIC_BUSINESS_NIT || "",
        address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || ""
      }
    });
  };

  const handleExportExcel = () => {
    generateReportExcel({
      sheetName: "Ventas_por_Fecha",
      title: "Reporte de Ventas por Fecha",
      dateRange: null,
      columns: [
        { header: "Fecha", key: "fecha", type: "date", width: 15 },
        { header: "N° Facturas", key: "num_facturas", type: "number", width: 15 },
        { header: "Subtotal", key: "subtotal", type: "money", width: 20 },
        { header: "IVA", key: "iva", type: "money", width: 20 },
        { header: "Total", key: "total", type: "money", width: 20 }
      ],
      data: data,
      totalsRow: {
        fecha: "TOTAL",
        num_facturas: data.reduce((a,b) => a + Number(b.num_facturas), 0),
        subtotal: data.reduce((a,b) => a + Number(b.subtotal), 0),
        iva: data.reduce((a,b) => a + Number(b.iva), 0),
        total: data.reduce((a,b) => a + Number(b.total), 0)
      }
    });
  };

  const chartData = data.map(d => ({
    name: new Date(d.fecha).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }),
    Total: Number(d.total)
  })).reverse();

  return (
    <div className="space-y-6 p-6">
      <ExportBar onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} disabled={data.length === 0} />
      
      {data.length > 0 ? (
        <>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                <RechartsTooltip formatter={(value: number) => formatMoney(value)} />
                <Bar dataKey="Total" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Facturas</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">IVA</TableHead>
                  <TableHead className="text-right font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{new Date(row.fecha).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">{row.num_facturas}</TableCell>
                    <TableCell className="text-right">{formatMoney(row.subtotal)}</TableCell>
                    <TableCell className="text-right">{formatMoney(row.iva)}</TableCell>
                    <TableCell className="text-right font-bold text-blue-700">{formatMoney(row.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500 border border-dashed rounded-md">
          No hay datos para el rango seleccionado.
        </div>
      )}
    </div>
  );
}
