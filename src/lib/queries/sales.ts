import { createServerClient } from '../supabase-server';

export async function getSales(page: number = 1, pageSize: number = 50) {
  const supabase = await createServerClient();
  
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('sales_with_detail')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data, count };
}

export async function getSaleById(id: string) {
  const supabase = await createServerClient();

  const { data: sale, error: saleError } = await supabase
    .from('sales_with_detail')
    .select('*')
    .eq('id', id)
    .single();

  if (saleError) throw saleError;

  const { data: items, error: itemsError } = await supabase
    .from('sale_items')
    .select(`
      *,
      products (name, code_qr_bar)
    `)
    .eq('sale_id', id);

  if (itemsError) throw itemsError;

  return { sale, items };
}
