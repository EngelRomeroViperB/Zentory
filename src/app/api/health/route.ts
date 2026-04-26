import { NextResponse } from 'next/server';
import { createServerClient } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic'; // Asegurar no cache

export async function GET() {
  try {
    const supabase = await createServerClient();
    
    // Verificación de BD
    const { data, error } = await supabase.from('user_roles').select('id').limit(1);
    const dbStatus = error ? 'error' : 'ok';
    
    // Verificación de variables
    const envStatus = (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) 
      ? 'missing' : 'ok';
      
    const status = (dbStatus === 'ok' && envStatus === 'ok') ? 'ok' : 'degraded';

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbStatus,
        env_vars: envStatus
      },
      version: process.env.npm_package_version || "1.0.0"
    }, { status: status === 'ok' ? 200 : 503 });

  } catch (error) {
    return NextResponse.json({
      status: 'down',
      timestamp: new Date().toISOString(),
      error: 'Error interno en health check'
    }, { status: 503 });
  }
}
