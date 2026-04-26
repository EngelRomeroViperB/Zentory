declare module 'next-safe-action' {
  import { z } from 'zod';

  export const DEFAULT_SERVER_ERROR_MESSAGE = "Something went wrong while executing the operation.";

  export class ActionError extends Error {
    constructor(message: string);
  }

  export interface SafeActionClientOpts {
    handleReturnedServerError?: (e: Error) => string;
  }

  export interface MiddlewareFn<Ctx extends object> {
    (opts: { ctx: Ctx; next: { ctx: Ctx } }): Promise<{ ctx: Ctx }>;
  }

  export interface ActionFn<Ctx extends object, Schema extends z.ZodTypeAny, ReturnData> {
    (opts: { parsedInput: z.infer<Schema>; ctx: Ctx }): Promise<ReturnData>;
  }

  export interface SafeActionClient<Ctx extends object> {
    use: <NewCtx extends object>(middleware: MiddlewareFn<Ctx & NewCtx>) => SafeActionClient<Ctx & NewCtx>;
    schema: <Schema extends z.ZodTypeAny>(schema: Schema) => SafeActionClientWithSchema<Ctx, Schema>;
  }

  export interface SafeActionClientWithSchema<Ctx extends object, Schema extends z.ZodTypeAny> {
    action: <ReturnData>(fn: ActionFn<Ctx, Schema, ReturnData>) => any;
  }

  // Use any for supabase client to avoid type conflicts
  export function createSafeActionClient(opts?: SafeActionClientOpts): SafeActionClient<{ 
    supabase: any;
    user: { id: string; email?: string };
    role: string;
  }>;
}
