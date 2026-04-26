'use client';

import { useState } from 'react';
import { updateBusinessConfig } from '@/lib/actions/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface BusinessConfig {
  business_name: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
  message: string;
  tax_rate: number;
  logo_url: string | null;
}

interface ConfigFormProps {
  initialData: BusinessConfig;
}

export function ConfigForm({ initialData }: ConfigFormProps) {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      await updateBusinessConfig(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      alert('Error al guardar configuración: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Negocio</CardTitle>
        <CardDescription>Estos datos aparecerán en las facturas y documentos.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded">
              Configuración guardada correctamente.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre del Negocio *</Label>
              <Input
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>NIT *</Label>
              <Input
                value={formData.nit}
                onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Dirección *</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Teléfono *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Mensaje en Factura *</Label>
            <Input
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Tasa de Impuesto (%) *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.tax_rate}
              onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div>
            <Label>URL del Logo (opcional)</Label>
            <Input
              type="url"
              value={formData.logo_url || ''}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value || null })}
              placeholder="https://..."
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
