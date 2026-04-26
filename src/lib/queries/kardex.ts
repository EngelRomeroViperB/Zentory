import { createServerClient } from '../supabase-server';

export async function getKardexByProduct(
  productId: string, 
  page: number = 1, 
  pageSize: number = 50,
  dateFrom?: string,
  dateTo?: string
) {
  const supabase = await createServerClient();
  
  let query = supabase
    .from('kardex_with_balance')
    .select('*', { count: 'exact' })
    .eq('product_id', productId);

  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  // Paginación
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;
  
  if (error) throw error;
  
  return { data, count };
}
