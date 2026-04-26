import { createServerClient } from '../supabase-server';

interface GetProductsOptions {
  search?: string;
  category_id?: string;
  low_stock?: boolean;
  page?: number;
  limit?: number;
}

interface PaginatedProductsResult {
  data: unknown[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getProducts(options?: GetProductsOptions): Promise<PaginatedProductsResult> {
  const supabase = await createServerClient();
  
  const page = options?.page || 1;
  const limit = options?.limit || 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Si es low_stock, usamos la vista (no tiene paginación por ahora)
  if (options?.low_stock) {
    const { data, error } = await supabase.from('products_low_stock').select('*');
    if (error) throw error;
    return {
      data: data || [],
      count: data?.length || 0,
      page: 1,
      limit: data?.length || 0,
      totalPages: 1,
    };
  }

  // Query con conteo
  let query = supabase
    .from('products')
    .select(`
      *,
      categories (name)
    `, { count: 'exact' });

  // Aplicar filtros
  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,code_qr_bar.ilike.%${options.search}%`);
  }
  if (options?.category_id) {
    query = query.eq('category_id', options.category_id);
  }

  // Paginación y ordenamiento
  query = query.order('name').range(from, to);
  
  const { data, error, count } = await query;
  if (error) throw error;
  
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    data: data || [],
    count: totalCount,
    page,
    limit,
    totalPages,
  };
}

export async function getProductById(id: string) {
  const supabase = await createServerClient();
  
  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`*, categories (name)`)
    .eq('id', id)
    .single();

  if (productError) throw productError;

  const { data: batches, error: batchesError } = await supabase
    .from('product_batches')
    .select('*')
    .eq('product_id', id)
    .order('expiry_date', { ascending: true });

  if (batchesError) throw batchesError;

  const { data: kardex, error: kardexError } = await supabase
    .from('kardex_with_balance')
    .select('*')
    .eq('product_id', id)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(10);

  if (kardexError) throw kardexError;

  return { product, batches, kardex };
}

export async function getCategories() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
    
  if (error) throw error;
  return data;
}
