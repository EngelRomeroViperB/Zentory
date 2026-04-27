'use client';

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateUserRole, createUser } from "@/lib/actions/admin";
import { toast } from "sonner";

interface User {
  user_id: string;
  email: string | undefined;
  role: string;
  created_at: string | undefined;
  last_sign_in_at?: string | null;
}

export function UserRolesManager({ users }: { users: User[] }) {
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [newUser, setNewUser] = React.useState({ email: '', password: '', role: 'vendedor' as string });
  const [creating, setCreating] = React.useState(false);

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await createUser(newUser);
      if (res?.data?.success) {
        toast.success("Usuario creado correctamente.");
        setNewUser({ email: '', password: '', role: 'vendedor' });
        setShowForm(false);
      } else if (res?.serverError) {
        toast.error(res.serverError);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo Usuario'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Nuevo Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="usuario@empresa.com"
                    required
                  />
                </div>
                <div>
                  <Label>Contraseña *</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <Label>Rol *</Label>
                  <Select value={newUser.role} onValueChange={(val) => setNewUser({ ...newUser, role: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="bodeguero">Bodeguero</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

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
    </div>
  );
}
