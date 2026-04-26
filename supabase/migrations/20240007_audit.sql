-- ══════════════════════════════════════════════════════════════════════════
-- Zentory — Migración 007: Auditoría
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  user_email text,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION log_critical_changes()
RETURNS trigger AS $$
DECLARE
  v_user_email text;
  v_old_data jsonb := NULL;
  v_new_data jsonb := NULL;
  v_action text := TG_OP;
  v_record_id uuid;
BEGIN
  -- Obtener email del usuario activo (puede ser null si es service role)
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_new_data := to_jsonb(NEW);
    v_record_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_record_id := NEW.id;
    
    -- Filtros específicos
    IF TG_TABLE_NAME = 'sales' AND OLD.status = NEW.status THEN
      RETURN NEW; -- Solo auditar si cambia el status
    END IF;
    
    IF TG_TABLE_NAME = 'products' AND OLD.cost_price = NEW.cost_price AND OLD.sale_price = NEW.sale_price THEN
      RETURN NEW; -- Solo auditar cambios en precios
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_record_id := OLD.id;
  END IF;

  INSERT INTO audit_log (user_id, user_email, action, table_name, record_id, old_data, new_data)
  VALUES (auth.uid(), v_user_email, v_action, TG_TABLE_NAME, v_record_id, v_old_data, v_new_data);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- APPLY TRIGGERS
CREATE TRIGGER audit_sales_changes
  AFTER UPDATE OR DELETE ON sales
  FOR EACH ROW EXECUTE FUNCTION log_critical_changes();

CREATE TRIGGER audit_user_roles_changes
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION log_critical_changes();

CREATE TRIGGER audit_products_changes
  AFTER UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION log_critical_changes();

-- FUNCIÓN DE LECTURA (Solo Admin)
CREATE OR REPLACE FUNCTION get_audit_log(
  p_table_name text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_from timestamptz DEFAULT now() - interval '30 days',
  p_to timestamptz DEFAULT now(),
  p_limit int DEFAULT 100
)
RETURNS SETOF audit_log AS $$
BEGIN
  IF get_my_role() != 'admin' THEN
    RAISE EXCEPTION 'Acceso denegado. Solo administradores pueden ver auditorías.';
  END IF;

  RETURN QUERY 
  SELECT * FROM audit_log
  WHERE (p_table_name IS NULL OR table_name = p_table_name)
    AND (p_user_id IS NULL OR user_id = p_user_id)
    AND created_at >= p_from
    AND created_at <= p_to
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
