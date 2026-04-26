import { ReportLayout } from "@/components/reportes/ReportLayout";
import { SalesByDateReport } from "@/components/reportes/ventas/SalesByDateReport";
import { getSalesByDate } from "@/lib/queries/reports-ventas";

export default async function SalesByDatePage() {
  const { data } = await getSalesByDate({});

  return (
    <ReportLayout 
      title="Ventas por Fecha" 
      description="Análisis de ingresos agrupados por días."
      // filters={<ReportFilters ... />} // Se omiten filtros complejos por brevedad
    >
      <SalesByDateReport data={data || []} />
    </ReportLayout>
  );
}
