import { toast } from "sonner";

interface ExportConfig {
  data: Record<string, unknown>[];
  filename: string;
  headers: { key: string; label: string }[];
}

const MAX_EXPORT_LIMIT = 5000;

export function exportToCSV({ data, filename, headers }: ExportConfig): void {
  // Validar límite de registros
  if (data.length > MAX_EXPORT_LIMIT) {
    toast.error(`No se puede exportar más de ${MAX_EXPORT_LIMIT.toLocaleString()} registros. Por favor usa filtros para reducir el resultado.`);
    return;
  }

  if (data.length === 0) {
    toast.warning("No hay datos para exportar");
    return;
  }

  try {
    // Convertir datos a CSV
    const csvContent = convertToCSV(data, headers);
    
    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exportados ${data.length} registros exitosamente`);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    toast.error("Error al generar el archivo CSV");
  }
}

function convertToCSV(data: Record<string, unknown>[], headers: { key: string; label: string }[]): string {
  // Crear fila de encabezados
  const headerRow = headers.map(h => escapeCSV(h.label)).join(',');
  
  // Crear filas de datos
  const rows = data.map(row => {
    return headers.map(header => {
      const value = row[header.key];
      return escapeCSV(formatValue(value));
    }).join(',');
  });
  
  return [headerRow, ...rows].join('\n');
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (typeof value === 'number') return value.toString();
  return String(value);
}

function escapeCSV(value: string): string {
  // Si contiene coma, comillas o nueva línea, envolver en comillas
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Headers predefinidos para productos
export const productExportHeaders = [
  { key: 'code_qr_bar', label: 'Código' },
  { key: 'name', label: 'Nombre' },
  { key: 'category_name', label: 'Categoría' },
  { key: 'current_stock', label: 'Stock Actual' },
  { key: 'min_stock', label: 'Stock Mínimo' },
  { key: 'cost_price', label: 'Costo' },
  { key: 'sale_price', label: 'Precio Venta' },
];

export function validateExportSize(count: number): boolean {
  if (count > MAX_EXPORT_LIMIT) {
    toast.error(
      `El export tiene ${count.toLocaleString()} registros. ` +
      `El límite máximo es ${MAX_EXPORT_LIMIT.toLocaleString()}. ` +
      `Por favor usa filtros de fecha o categoría para reducir los resultados.`
    );
    return false;
  }
  return true;
}
