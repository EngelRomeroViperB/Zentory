import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, LineChart, PieChart, CalendarDays, TrendingUp, PackageSearch, AlertTriangle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import dinero from "dinero.js";

// Layout principal del Hub de reportes
export default async function ReportesHubPage() {
  const supabase = await createServerClient();
  const { data: roleData } = await supabase.rpc('get_my_role');
  const role = roleData;
  const isAdmin = role === 'admin';

  // Obtener métricas rápidas (mock/simulado para el hub)
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  
  const { data: sales } = await supabase.from('sales').select('total').gte('created_at', currentMonthStart.toISOString()).eq('status', 'ACTIVE');
  const { data: purchases } = await supabase.from('purchases').select('total').gte('created_at', currentMonthStart.toISOString()).eq('status', 'ACTIVE');
  const { data: valuation } = await supabase.from('inventory_valuation').select('total_value');
  const { count: lowStock } = await supabase.from('products_low_stock').select('*', { count: 'exact', head: true });

  const totalSales = (sales || []).reduce((acc, s) => acc + Number(s.total), 0);
  const totalPurchases = (purchases || []).reduce((acc, p) => acc + Number(p.total), 0);
  const totalValuation = (valuation || []).reduce((acc, v) => acc + Number(v.total_value), 0);

  const ReportCard = ({ title, description, href, icon: Icon, adminOnly = false }: any) => {
    const disabled = adminOnly && !isAdmin;

    return (
      <Card className={`hover:shadow-md transition-shadow ${disabled ? 'opacity-70 grayscale' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-slate-100 rounded-md">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
            {adminOnly && <Badge variant="secondary"><ShieldAlert className="h-3 w-3 mr-1" /> Solo Admin</Badge>}
          </div>
          <CardTitle className="text-lg mt-4">{title}</CardTitle>
          <CardDescription className="h-10">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {disabled ? (
            <div className="w-full text-center py-2 text-sm text-gray-500 bg-gray-100 rounded-md cursor-not-allowed">
              Acceso Denegado
            </div>
          ) : (
            <Link href={href} className="w-full block text-center py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
              Abrir Reporte
            </Link>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Centro de Reportes</h1>
        <p className="text-gray-500">Analiza el rendimiento de ventas, inventario y compras.</p>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dinero({ amount: Math.round(totalSales * 100), currency: 'USD' }).toFormat('$0,0.00')}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Compras del Mes</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dinero({ amount: Math.round(totalPurchases * 100), currency: 'USD' }).toFormat('$0,0.00')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Valoración Inventario</CardTitle>
            <PieChart className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dinero({ amount: Math.round(totalValuation * 100), currency: 'USD' }).toFormat('$0,0.00')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Alertas Stock</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${lowStock && lowStock > 0 ? 'text-red-500' : 'text-gray-400'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lowStock || 0}
            </div>
            <p className="text-xs text-muted-foreground">Productos bajo el mínimo</p>
          </CardContent>
        </Card>
      </div>

      {/* Secciones de Reportes */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Ventas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <ReportCard title="Ventas por Fecha" description="Ingresos agrupados por día, semana o mes." href="/reportes/ventas/por-fecha" icon={CalendarDays} />
            <ReportCard title="Ventas por Producto" description="Top productos por ingresos y rentabilidad." href="/reportes/ventas/por-producto" icon={BarChart3} />
            <ReportCard title="Libro de Ventas" description="Reporte formal de IVA y base imponible." href="/reportes/ventas/libro-ventas" icon={FileText} adminOnly />
            {/* Omitimos los otros para este MVP */}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Inventario</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <ReportCard title="Reporte de Kardex" description="Historial de movimientos por producto." href="/reportes/inventario/kardex" icon={PackageSearch} />
            <ReportCard title="Reporte de Reorden" description="Sugerencias de reabastecimiento." href="/reportes/inventario/reorden" icon={AlertTriangle} />
            <ReportCard title="Valorización" description="Distribución del capital invertido." href="/reportes/inventario/valorizacion" icon={PieChart} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Fake FileText icon to avoid errors
function FileText(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>;
}
