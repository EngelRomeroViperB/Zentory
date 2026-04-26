-- Configuración del negocio (editable desde el admin)
CREATE TABLE IF NOT EXISTS business_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL DEFAULT 'Mi Empresa',
  nit text NOT NULL DEFAULT 'NIT: 123456789-0',
  address text NOT NULL DEFAULT 'Dirección',
  phone text NOT NULL DEFAULT 'Tel: (123) 456-7890',
  email text NOT NULL DEFAULT 'contacto@empresa.com',
  message text NOT NULL DEFAULT 'Gracias por su compra!',
  tax_rate numeric(5,2) NOT NULL DEFAULT 19.00,
  logo_url text,
  updated_at timestamptz DEFAULT now()
);

-- Insertar configuración inicial
INSERT INTO business_config (business_name, nit, address, phone, email, message, tax_rate)
VALUES ('Tu Empresa S.A.', 'NIT: 123456789-0', 'Calle Principal #123, Ciudad', 'Tel: (123) 456-7890', 'contacto@tuempresa.com', 'Gracias por su compra!', 19.00)
ON CONFLICT DO NOTHING;

-- RLS: Solo admin puede modificar
ALTER TABLE business_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo admin puede ver config" ON business_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Solo admin puede actualizar config" ON business_config
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Función para obtener config pública (sin RLS)
CREATE OR REPLACE FUNCTION get_business_config()
RETURNS TABLE (
  business_name text,
  nit text,
  address text,
  phone text,
  email text,
  message text,
  tax_rate numeric,
  logo_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT business_name, nit, address, phone, email, message, tax_rate, logo_url
  FROM business_config
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
