import { createServerClient } from "@/lib/supabase-server";
import { UserRolesManager } from "@/components/admin/UserRolesManager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import * as Sentry from '@sentry/nextjs';

interface AuthUser {
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface UserRoleRow {
  user_id: string;
  role: 'admin' | 'vendedor' | 'bodeguero';
  users: AuthUser | null;
}

export default async function UsuariosPage() {
  const supabase = await createServerClient();
  
  // Obtenemos los usuarios desde user_roles haciendo join con auth.users
  const { data: users, error } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      role,
      users:auth.users (
        email,
        created_at,
        last_sign_in_at
      )
    `)
    .returns<UserRoleRow[]>();

  if (error) {
    Sentry.captureException(error, {
      extra: { context: 'fetching users in UsuariosPage' }
    });
  }

  // Aplanamos la data para la UI
  const flatUsers = (users || []).map(u => ({
    user_id: u.user_id,
    role: u.role,
    email: u.users?.email,
    created_at: u.users?.created_at,
    last_sign_in_at: u.users?.last_sign_in_at
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <p className="text-gray-500">Asigna y modifica los permisos del equipo.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
          <CardDescription>Cambiar roles afecta los permisos de inmediato.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserRolesManager users={flatUsers} />
        </CardContent>
      </Card>
    </div>
  );
}
