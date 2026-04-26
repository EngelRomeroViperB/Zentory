import { createServerClient } from '../supabase-server';

interface BusinessConfig {
  business_name: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
  message: string;
  tax_rate: number;
  logo_url: string | null;
}

export async function getBusinessConfig(): Promise<BusinessConfig> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('get_business_config').single();

  if (error) throw error;
  return data as BusinessConfig;
}
