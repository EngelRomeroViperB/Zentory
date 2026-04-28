import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-red-100 rounded-full">
            <ShieldAlert className="w-12 h-12 text-red-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Acceso Denegado</h1>
        <p className="text-gray-600">
          No tienes los permisos necesarios para acceder a esta página. 
          Si crees que esto es un error, contacta al administrador del sistema.
        </p>
        <div className="pt-4">
          <Button asChild className="w-full">
            <Link href="/login"> Volver al Inicio </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
