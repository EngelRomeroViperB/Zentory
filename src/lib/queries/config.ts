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
  const supabase = createServerClient();
  
  // Usar la tabla directamente para evitar el error RPC "ambiguous column"
  const { data, error } = await supabase.from('business_config').select('*').limit(1).maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  
  return data as BusinessConfig || {
    business_name: 'Zentory',
    nit: '',
    address: '',
    phone: '',
    email: '',
    message: '',
    tax_rate: 19,
    logo_url: null
  };
}
