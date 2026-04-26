import { createServerClient } from "@/lib/supabase-server";
import { SystemStatus } from "@/components/admin/SystemStatus";
import { StorageUsageCard } from "@/components/admin/StorageUsageCard";
import { AuditLogTable } from "@/components/admin/AuditLogTable";

export const revalidate = 60; // Revalidar cada 60 segundos

export default async function SistemaPage() {
  const supabase = await createServerClient();

  // Obtener logs de auditoría (últimos 50) usando la función RPC
  const { data: auditLogs } = await supabase.rpc('get_audit_log', {
    p_limit: 50
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Estado del Sistema y Auditoría</h1>
        <p className="text-gray-500">Monitoreo de servicios y registro de eventos críticos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SystemStatus />
        <StorageUsageCard />
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Registro de Auditoría (Audit Log)</h2>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <AuditLogTable logs={auditLogs || []} />
        </div>
      </div>
    </div>
  );
}
