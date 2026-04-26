import { createServerClient } from '../supabase-server';

export async function getLowStockProducts() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('products_low_stock')
    .select('*')
    .order('current_stock', { ascending: true })
    .limit(10);
    
  if (error) throw error;
  return data;
}

export async function getExpiringBatches() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('batches_expiring_soon')
    .select('*')
    .order('expiry_date', { ascending: true })
    .limit(10);
    
  if (error) throw error;
  return data;
}

export async function getInventoryValuation() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('inventory_valuation')
    .select('*')
    .limit(10);
    
  if (error) throw error;
  return data;
}
