import { authAction, getAuthContext } from '@/lib/safe-action';
import { z } from 'zod';

const configSchema = z.object({
  business_name: z.string().min(1),
  nit: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
  tax_rate: z.number().min(0).max(100),
  logo_url: z.string().url().optional().or(z.literal('')),
});

export const updateBusinessConfig = authAction
  .schema(configSchema)
  .action(async ({ parsedInput }) => {
    const ctx = await getAuthContext();
    
    const { data, error } = await ctx.supabase
      .from('business_config')
      .update({
        ...parsedInput,
        logo_url: parsedInput.logo_url || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return data;
  });
