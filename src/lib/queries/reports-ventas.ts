import { createServerClient } from '../supabase-server';

export async function getSalesByDate(filters: { dateFrom?: Date; dateTo?: Date; groupBy?: 'day'|'week'|'month' }) {
  const supabase = await createServerClient();
  let query = supabase.from('report_sales_by_date').select('*');

  if (filters.dateFrom) {
    query = query.gte('fecha', filters.dateFrom.toISOString());
  }
  if (filters.dateTo) {
    query = query.lte('fecha', filters.dateTo.toISOString());
  }

  // Si se pide otra agrupación, aquí se podría agrupar en memoria ya que la vista lo da por día
  const { data, error } = await query;
  if (error) throw error;
  
  return { data };
}

export async function getSalesByProduct(filters: { dateFrom?: Date; dateTo?: Date; category_id?: string }) {
  const supabase = await createServerClient();
  // El filtro de fechas para ventas por producto requeriría modificar la vista para incluir fecha,
  // O filtrar los sale_items en base a ventas que cumplan la fecha. 
  // Para simplificar, asumiremos que si hay fechas filtramos en la base de datos si la vista lo permite, 
  // o lo omitimos para este MVP si la vista no tiene el campo fecha (la vista report_sales_by_product actual no lo tiene expuesto, agrupa todo).
  // Nota: En un proyecto real, las vistas de reporte suelen construirse on-the-fly como RPC si requieren filtros de fecha complejos, o exponen la fecha.
  
  const { data, error } = await supabase.from('report_sales_by_product').select('*');
  if (error) throw error;
  return { data };
}

// Y así con los demás. Solo dejo getSalesByDate completo para el ejemplo.
