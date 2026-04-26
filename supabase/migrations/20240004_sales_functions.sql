-- ══════════════════════════════════════════════════════════════════════════
-- Zentory — Migración 004: Funciones de Ventas y POS
-- ══════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- FUNCIÓN 1: create_sale(p_client_id, p_vendedor_id, p_items, p_tax_rate)
-- Flujo atómico para registrar la venta: inserta cabecera, itera items para 
-- insertar detalle y actualizar stock con PEPS. Calcula totales.
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_sale(
  p_client_id uuid,
  p_vendedor_id uuid,
  p_items jsonb,
  p_tax_rate numeric
)
RETURNS TABLE (
  sale_id uuid,
  invoice_number text,
  total numeric,
  tax_amount numeric
) AS $$
DECLARE
  v_sale_id uuid;
  v_invoice_number text;
  v_item record;
  v_total numeric(12,2) := 0;
  v_tax_amount numeric(12,2) := 0;
  v_subtotal numeric(12,2);
  v_product_name text;
BEGIN
  -- 1. Insert en sales
  INSERT INTO sales (client_id, vendedor_id)
  VALUES (p_client_id, p_vendedor_id)
  RETURNING id, sales.invoice_number INTO v_sale_id, v_invoice_number;

  -- 2. Iterar items
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id uuid, 
    quantity int, 
    unit_price numeric, 
    unit_cost numeric, 
    discount_pct numeric, 
    batch_id uuid
  )
  LOOP
    -- Obtener nombre para errores
    SELECT name INTO v_product_name FROM products WHERE id = v_item.product_id;

    -- a. Insert en sale_items (subtotal es STORED, no se envía)
    INSERT INTO sale_items (
      sale_id, product_id, batch_id, quantity, unit_price, unit_cost, discount_pct, tax_rate
    ) VALUES (
      v_sale_id, v_item.product_id, v_item.batch_id, v_item.quantity, v_item.unit_price, 
      v_item.unit_cost, v_item.discount_pct, p_tax_rate
    ) RETURNING sale_items.subtotal INTO v_subtotal;

    v_total := v_total + v_subtotal;

    -- b. Descontar stock usando la función PEPS existente
    BEGIN
      PERFORM apply_fifo_exit(v_item.product_id, v_item.quantity, 'SALE-' || v_sale_id::text);
    EXCEPTION WHEN others THEN
      -- Si hay error (ej: stock insuficiente), propagar con el nombre del producto
      RAISE EXCEPTION 'Error descontando stock para %: %', v_product_name, SQLERRM;
    END;

  END LOOP;

  -- 3 & 4. Update sales total y tax
  v_tax_amount := ROUND(v_total * (p_tax_rate / 100), 2);
  
  UPDATE sales 
  SET 
    total = v_total,
    tax_amount = v_tax_amount
  WHERE id = v_sale_id;

  -- 5. Retornar
  RETURN QUERY SELECT v_sale_id, v_invoice_number, v_total, v_tax_amount;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ──────────────────────────────────────────────────────────────────────────
-- FUNCIÓN 2: void_sale(p_sale_id, p_reason)
-- Solo admin: anula la venta, devuelve stock (Kardex ENTRY/RETURN),
-- actualiza estado a DELETED.
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION void_sale(
  p_sale_id uuid,
  p_reason text
)
RETURNS void AS $$
DECLARE
  v_status sale_status;
  v_item record;
BEGIN
  -- Verificación de rol admin ya se hace en la política o server action, 
  -- pero lo forzamos aquí para la seguridad de la capa BD:
  IF get_my_role() != 'admin' THEN
    RAISE EXCEPTION 'Solo administradores pueden anular ventas';
  END IF;

  -- 1. Verificar estado
  SELECT status INTO v_status FROM sales WHERE id = p_sale_id;
  IF v_status != 'ACTIVE' THEN
    RAISE EXCEPTION 'La venta no está activa y no puede anularse';
  END IF;

  -- 2. Iterar items para devolver stock
  FOR v_item IN SELECT * FROM sale_items WHERE sale_id = p_sale_id
  LOOP
    -- a. Insert en Kardex como RETURN
    INSERT INTO kardex_movements (
      product_id, batch_id, type, quantity, unit_cost, reference_doc, notes, created_by
    ) VALUES (
      v_item.product_id, v_item.batch_id, 'RETURN', v_item.quantity, v_item.unit_cost, 
      'VOID-' || p_sale_id::text, p_reason, auth.uid()
    );

    -- b. Restaurar stock en producto
    UPDATE products
    SET 
      current_stock = current_stock + v_item.quantity,
      updated_at = now()
    WHERE id = v_item.product_id;

    -- c. Restaurar cantidad en lote (si existe)
    IF v_item.batch_id IS NOT NULL THEN
      UPDATE product_batches
      SET quantity = quantity + v_item.quantity
      WHERE id = v_item.batch_id;
    END IF;

  END LOOP;

  -- 3. Actualizar estado de la venta
  UPDATE sales 
  SET 
    status = 'DELETED',
    notes = COALESCE(notes, '') || ' | ANULADA: ' || p_reason,
    updated_at = now()
  WHERE id = p_sale_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ──────────────────────────────────────────────────────────────────────────
-- VISTA: sales_with_detail
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW sales_with_detail AS
SELECT 
  s.id, s.invoice_number, s.created_at, s.total, s.tax_amount, s.status, s.notes,
  c.id AS client_id, c.name AS client_name, c.nit AS client_nit,
  u.id AS vendedor_id, u.email AS vendedor_email,
  (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS item_count
FROM sales s
LEFT JOIN clients c ON s.client_id = c.id
LEFT JOIN auth.users u ON s.vendedor_id = u.id;
