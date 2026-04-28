import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { formatMoney as formatMoneyFromConfig } from "@/lib/config/dinero";

export function formatMoney(value: string | number): string {
  return formatMoneyFromConfig(value);
}

export interface PDFReportConfig {
  title: string;
  subtitle: string | null;
  dateRange: { from: Date; to: Date } | null;
  columns: Array<{ header: string; dataKey: string; width?: number }>;
  data: Record<string, unknown>[];
  totalsRow: Record<string, string | number> | null;
  businessInfo: {
    name: string;
    nit: string;
    address: string;
  };
  orientation?: 'portrait' | 'landscape';
}

export function generateReportPDF(config: PDFReportConfig) {
  const orientation = config.orientation || (config.columns.length > 6 ? 'landscape' : 'portrait');
  const doc = new jsPDF({ orientation, format: 'a4' });

  // Encabezado del negocio
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(config.businessInfo.name, 14, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(config.businessInfo.nit, 14, 21);
  doc.text(config.businessInfo.address, 14, 27);

  // Título del reporte
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const titleY = 40;
  doc.text(config.title, 14, titleY);

  let currentY = titleY + 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  if (config.subtitle) {
    doc.text(config.subtitle, 14, currentY);
    currentY += 6;
  }

  if (config.dateRange) {
    const fromStr = config.dateRange.from.toLocaleDateString();
    const toStr = config.dateRange.to.toLocaleDateString();
    doc.text(`Período: ${fromStr} - ${toStr}`, 14, currentY);
    currentY += 8;
  }

  // Preparar datos
  const body = config.data.map(row => {
    return config.columns.map(col => {
      const val = row[col.dataKey];
      return val !== null && val !== undefined ? val.toString() : '-';
    });
  });

  if (config.totalsRow) {
    const totals = config.columns.map(col => {
      const val = config.totalsRow![col.dataKey];
      return val !== undefined ? val.toString() : '';
    });
    body.push(totals);
  }

  // Generar tabla
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (doc as unknown as { autoTable: (options: Record<string, unknown>) => void }).autoTable({
    startY: currentY,
    head: [config.columns.map(c => c.header)],
    body: body,
    theme: 'grid',
    headStyles: { fillColor: [60, 60, 60], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    willDrawCell: function (data: { row: { index: number } }) {
      if (config.totalsRow && data.row.index === body.length - 1) {
        doc.setFont("helvetica", "bold");
        doc.setFillColor(220, 220, 220);
      }
    },
    didDrawPage: function () {
      // Pie de página
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      const dateStr = new Date().toLocaleString();
      doc.text(`Generado el: ${dateStr} - Página ${doc.getCurrentPageInfo().pageNumber}`, 14, pageHeight - 10);
    }
  });

  doc.save(`${config.title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}
