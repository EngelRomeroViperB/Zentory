import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Database, Shield, LayoutDashboard, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createServerClient } from "@/lib/supabase-server";

export default async function AdminHubPage() {
  const supabase = await createServerClient();
  const { count } = await supabase.from('audit_log').select('*', { count: 'exact', head: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-gray-500">Gestión de usuarios, auditoría y mantenimiento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <Users className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle>Usuarios y Roles</CardTitle>
            <CardDescription>Asigna permisos a tu equipo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/usuarios">
              <Button className="w-full">Gestionar Usuarios</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <Shield className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle>Estado y Auditoría</CardTitle>
            <CardDescription>{count || 0} eventos registrados.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/sistema">
              <Button className="w-full" variant="outline">Ver Logs</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <Database className="h-8 w-8 text-purple-600 mb-2" />
            <CardTitle>Infraestructura</CardTitle>
            <CardDescription>Enlaces rápidos a los proveedores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="https://supabase.com/dashboard/projects" target="_blank" rel="noreferrer">
              <Button variant="secondary" className="w-full justify-start"><ExternalLink className="mr-2 h-4 w-4" /> Supabase</Button>
            </a>
            <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">
              <Button variant="secondary" className="w-full justify-start"><ExternalLink className="mr-2 h-4 w-4" /> Vercel</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
