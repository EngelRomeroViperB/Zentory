-- ══════════════════════════════════════════════════════════════════════════
-- Zentory — Migración 006: Archivado de Datos
-- ══════════════════════════════════════════════════════════════════════════

-- TABLA: sales_archive
CREATE TABLE sales_archive (
  id uuid PRIMARY KEY,
  client_id uuid,
  vendedor_id uuid,
  invoice_number text,
  total numeric(12,2),
  tax_amount numeric(12,2),
  status text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  archived_at timestamptz DEFAULT now(),
  archive_reason text DEFAULT 'scheduled'
);

CREATE INDEX idx_sales_archive_created_at ON sales_archive(created_at);

-- TABLA: kardex_archive
CREATE TABLE kardex_archive (
  id uuid PRIMARY KEY,
  product_id uuid,
  batch_id uuid,
  type text,
  quantity int,
  unit_cost numeric(12,2),
  reference_doc text,
  notes text,
  created_by uuid,
  created_at timestamptz,
  archived_at timestamptz DEFAULT now()
);

CREATE INDEX idx_kardex_archive_created_at ON kardex_archive(created_at);

-- No habilitamos RLS en estas tablas, son accesibles solo por service_role key o admin explícito.
-- REVOKE ALL ON sales_archive FROM authenticated, anon;
-- REVOKE ALL ON kardex_archive FROM authenticated, anon;

-- FUNCIÓN: archive_old_data
CREATE OR REPLACE FUNCTION archive_old_data(p_months_threshold int DEFAULT 12)
RETURNS jsonb AS $$
DECLARE
  v_sales_archived int := 0;
  v_kardex_archived int := 0;
  v_threshold_date timestamptz := now() - (p_months_threshold || ' months')::interval;
BEGIN
  -- 1. Insertar sales antiguas
  WITH inserted_sales AS (
    INSERT INTO sales_archive (id, client_id, vendedor_id, invoice_number, total, tax_amount, status, notes, created_at, updated_at, archived_at, archive_reason)
    SELECT id, client_id, vendedor_id, invoice_number, total, tax_amount, status, notes, created_at, updated_at, now(), 'scheduled'
    FROM sales
    WHERE created_at < v_threshold_date
    AND status IN ('ACTIVE', 'DELETED')
    RETURNING id
  )
  SELECT count(*) INTO v_sales_archived FROM inserted_sales;

  -- 2. Insertar kardex_movements antiguos (huérfanos de ventas recientes)
  WITH inserted_kardex AS (
    INSERT INTO kardex_archive (id, product_id, batch_id, type, quantity, unit_cost, reference_doc, notes, created_by, created_at, archived_at)
    SELECT id, product_id, batch_id, type, quantity, unit_cost, reference_doc, notes, created_by, created_at, now()
    FROM kardex_movements
    WHERE created_at < v_threshold_date
    AND id NOT IN (
      SELECT DISTINCT km.id FROM kardex_movements km
      JOIN sale_items si ON ('SALE-' || si.sale_id::text) = km.reference_doc
      JOIN sales s ON s.id = si.sale_id
      WHERE s.created_at >= v_threshold_date
    )
    RETURNING id
  )
  SELECT count(*) INTO v_kardex_archived FROM inserted_kardex;

  -- 3. Eliminar registros originales de sales (kardex_movements podría mantenerse si se desea, pero por simplicidad de archivo, lo dejamos si hay espacio o limpiamos)
  DELETE FROM sales
  WHERE id IN (
    SELECT id FROM sales_archive 
    WHERE archive_reason = 'scheduled' 
    AND archived_at >= now() - interval '10 minutes'
  );

  -- Omitimos DELETE de kardex por seguridad, usualmente los históricos de stock se conservan o se purgan tras un cierre de inventario completo.

  RETURN jsonb_build_object(
    'sales_archived', v_sales_archived,
    'kardex_archived', v_kardex_archived
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
