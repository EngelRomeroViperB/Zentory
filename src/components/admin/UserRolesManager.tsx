'use client';

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { updateUserRole } from "@/lib/actions/admin";
import { toast } from "sonner";

interface User {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
}

export function UserRolesManager({ users }: { users: User[] }) {
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoadingId(userId);
    try {
      const res = await updateUserRole({ user_id: userId, role: newRole as "admin" | "vendedor" | "bodeguero" });
      if (res?.data?.success) {
        toast.success("Rol actualizado correctamente.");
      } else if (res?.serverError) {
        toast.error(res.serverError);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge variant="default" className="bg-purple-600">Admin</Badge>;
      case 'bodeguero': return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Bodeguero</Badge>;
      case 'vendedor': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Vendedor</Badge>;
      default: return <Badge variant="outline">Sin Asignar</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Fecha Registro</TableHead>
            <TableHead>Última Actividad</TableHead>
            <TableHead>Rol Actual</TableHead>
            <TableHead>Cambiar Rol</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.user_id}>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</TableCell>
              <TableCell>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Nunca'}</TableCell>
              <TableCell>{getRoleBadge(user.role)}</TableCell>
              <TableCell>
                <Select 
                  disabled={loadingId === user.user_id}
                  value={user.role} 
                  onValueChange={(val) => handleRoleChange(user.user_id, val)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="bodeguero">Bodeguero</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
