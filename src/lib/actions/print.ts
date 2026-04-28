'use server';

import { authAction, getAuthContext } from '../safe-action';
import { z } from 'zod';

const queueIdSchema = z.object({
  queue_id: z.string().uuid(),
});

export const markAsPrinted = authAction(
  queueIdSchema,
  async (parsedInput) => {
    const ctx = await getAuthContext();
    
    const { error } = await ctx.supabase
      .from('print_queue')
      .update({ status: 'PRINTED', printed_at: new Date().toISOString() })
      .eq('id', parsedInput.queue_id);

    if (error) throw new Error(error.message);
    return { success: true };
  }
);

export const markAsFailed = authAction(
  queueIdSchema,
  async (parsedInput) => {
    const ctx = await getAuthContext();
    
    const { error } = await ctx.supabase
      .from('print_queue')
      .update({ status: 'FAILED' })
      .eq('id', parsedInput.queue_id);

    if (error) throw new Error(error.message);
    return { success: true };
  }
);
