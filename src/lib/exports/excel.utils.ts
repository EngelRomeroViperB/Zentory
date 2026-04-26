import * as XLSX from 'xlsx';

export interface ExcelReportConfig {
  sheetName: string;
  title: string;
  dateRange: { from: Date; to: Date } | null;
  columns: Array<{ header: string; key: string; width: number; type: 'text' | 'number' | 'money' | 'date' }>;
  data: Record<string, unknown>[];
  totalsRow: Record<string, unknown> | null;
}

export function generateReportExcel(config: ExcelReportConfig) {
  const wb = XLSX.utils.book_new();
  const wsData: (string | number | Date | null | unknown)[][] = [];

  // 1. Título
  wsData.push([config.title]);
  
  // 2. Rango de Fechas
  if (config.dateRange) {
    const fromStr = config.dateRange.from.toLocaleDateString();
    const toStr = config.dateRange.to.toLocaleDateString();
    wsData.push([`Período: ${fromStr} - ${toStr}`]);
  }
  
  wsData.push([]); // Espacio en blanco

  // 3. Cabeceras
  const headers = config.columns.map(c => c.header);
  wsData.push(headers);

  // 4. Datos
  config.data.forEach(row => {
    const rowData = config.columns.map(col => {
      const val = row[col.key];
      if (val === null || val === undefined) return '';
      if (col.type === 'money') return Number(val);
      if (col.type === 'number') return Number(val);
      if (col.type === 'date') return new Date(val as string | number).toLocaleDateString();
      return val.toString();
    });
    wsData.push(rowData);
  });

  // 5. Totales
  if (config.totalsRow) {
    const totalsData = config.columns.map(col => {
      const val = config.totalsRow![col.key];
      if (val === undefined) return '';
      if (col.type === 'money' || col.type === 'number') return Number(val);
      return val;
    });
    wsData.push(totalsData);
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Ajustar anchos
  ws['!cols'] = config.columns.map(c => ({ wch: c.width }));

  XLSX.utils.book_append_sheet(wb, ws, config.sheetName.substring(0, 31)); // Límite de 31 chars
  XLSX.writeFile(wb, `${config.sheetName.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
