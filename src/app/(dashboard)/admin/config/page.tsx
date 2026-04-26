import { getBusinessConfig } from '@/lib/queries/config';
import { ConfigForm } from '@/components/admin/ConfigForm';

export const revalidate = 60;

export default async function ConfigPage() {
  const config = await getBusinessConfig();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración del Negocio</h1>
        <p className="text-gray-500">Edita la información que aparece en las facturas.</p>
      </div>

      <ConfigForm initialData={config} />
    </div>
  );
}
