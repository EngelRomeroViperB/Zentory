-- ══════════════════════════════════════════════════════════════════════════
-- Zentory — Migración 008: Función Atómica para Compras
-- Reemplaza el flujo secuencial del cliente por una transacción PostgreSQL atómica
-- ══════════════════════════════════════════════════════════════════════════

-- FUNCIÓN: create_purchase_atomic
-- Inserta compra, lotes, ítems y registra entradas en Kardex en una transacción
CREATE OR REPLACE FUNCTION create_purchase_atomic(
  p_supplier_id uuid,
  p_invoice_number text,
  p_notes text,
  p_created_by uuid,
  p_items jsonb
)
RETURNS TABLE (
  purchase_id uuid,
  total numeric
) AS $$
DECLARE
  v_purchase_id uuid;
  v_total numeric(12,2) := 0;
  v_item record;
  v_batch_id uuid;
BEGIN
  -- Verificar permisos
  IF get_my_role() NOT IN ('admin', 'bodeguero') THEN
    RAISE EXCEPTION 'Acceso denegado. Se requiere rol de admin o bodeguero.';
  END IF;

  -- Calcular total primero
  SELECT COALESCE(SUM((item->>'quantity')::int * (item->>'unit_cost')::numeric), 0)
  INTO v_total
  FROM jsonb_array_elements(p_items) AS item;

  -- 1. Insertar la compra
  INSERT INTO purchases (supplier_id, invoice_number, total, notes, created_by)
  VALUES (p_supplier_id, p_invoice_number, v_total, p_notes, p_created_by)
  RETURNING id INTO v_purchase_id;

  -- 2. Iterar por cada ítem
  FOR v_item IN 
    SELECT 
      (item->>'product_id')::uuid as product_id,
      (item->>'quantity')::int as quantity,
      (item->>'unit_cost')::numeric as unit_cost,
      (item->>'expiry_date')::date as expiry_date,
      item->>'location' as location
    FROM jsonb_array_elements(p_items) AS item
  LOOP
    -- a. Crear el lote
    INSERT INTO product_batches (product_id, quantity, unit_cost, expiry_date, location)
    VALUES (v_item.product_id, 0, v_item.unit_cost, v_item.expiry_date, v_item.location)
    RETURNING id INTO v_batch_id;

    -- b. Insertar ítem de compra
    INSERT INTO purchase_items (purchase_id, product_id, batch_id, quantity, unit_cost)
    VALUES (v_purchase_id, v_item.product_id, v_batch_id, v_item.quantity, v_item.unit_cost);

    -- c. Registrar entrada en Kardex (esto actualiza el stock del lote y producto)
    PERFORM register_entry(
      v_item.product_id,
      v_batch_id,
      v_item.quantity,
      v_item.unit_cost,
      'Compra #' || v_purchase_id::text
    );
  END LOOP;

  -- Retornar resultado
  RETURN QUERY SELECT v_purchase_id, v_total;

EXCEPTION WHEN OTHERS THEN
  -- La transacción se hará rollback automáticamente
  RAISE EXCEPTION 'Error en la compra: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
