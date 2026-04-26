-- ══════════════════════════════════════════════════════════════════════════
-- Zentory — Migración 003: Funciones de Inventario
-- Implementación de PEPS (FIFO), cálculo de costo promedio ponderado y
-- registro de entradas al inventario.
-- ══════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- FUNCIÓN 2: apply_weighted_average_cost(p_product_id)
-- Calcula el costo promedio ponderado de un producto basándose en los lotes
-- que actualmente tienen cantidad > 0.
-- Fórmula: SUM(quantity * unit_cost) / SUM(quantity)
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION apply_weighted_average_cost(p_product_id uuid)
RETURNS numeric(12,2) AS $$
DECLARE
  v_total_value numeric;
  v_total_qty int;
  v_avg_cost numeric(12,2);
BEGIN
  -- Sumatoria del valor total y cantidad total de los lotes activos
  SELECT 
    COALESCE(SUM(quantity * unit_cost), 0),
    COALESCE(SUM(quantity), 0)
  INTO v_total_value, v_total_qty
  FROM product_batches
  WHERE product_id = p_product_id AND quantity > 0;

  IF v_total_qty = 0 THEN
    -- Si no hay stock, el costo promedio es 0 o se podría mantener el anterior
    -- Para evitar divisiones por cero, retornamos 0.
    v_avg_cost := 0;
  ELSE
    v_avg_cost := ROUND(v_total_value / v_total_qty, 2);
  END IF;

  RETURN v_avg_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ──────────────────────────────────────────────────────────────────────────
-- FUNCIÓN 1: apply_fifo_exit(p_product_id, p_quantity, p_reference)
-- Descuenta stock aplicando PEPS (lote más antiguo primero).
-- Actualiza lotes, registra movimiento EXIT por cada lote afectado y
-- actualiza el stock total del producto.
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION apply_fifo_exit(
  p_product_id uuid,
  p_quantity int,
  p_reference text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_remaining_qty int := p_quantity;
  v_batch record;
  v_deduct_qty int;
  v_current_stock int;
BEGIN
  -- Verificar stock disponible total para no descontar si no alcanza
  SELECT current_stock INTO v_current_stock
  FROM products
  WHERE id = p_product_id FOR UPDATE; -- Bloqueo de fila para concurrencia

  IF v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Stock insuficiente para el producto %. Solicitado: %, Disponible: %', p_product_id, p_quantity, v_current_stock;
  END IF;

  -- Iterar sobre lotes con cantidad > 0 en orden cronológico (creación)
  FOR v_batch IN 
    SELECT * FROM product_batches 
    WHERE product_id = p_product_id AND quantity > 0 
    ORDER BY created_at ASC, id ASC 
    FOR UPDATE
  LOOP
    IF v_remaining_qty <= 0 THEN
      EXIT; -- Ya se descontó toda la cantidad requerida
    END IF;

    -- Determinar cuánto descontar de este lote
    IF v_batch.quantity >= v_remaining_qty THEN
      v_deduct_qty := v_remaining_qty;
    ELSE
      v_deduct_qty := v_batch.quantity;
    END IF;

    -- Actualizar el lote
    UPDATE product_batches
    SET quantity = quantity - v_deduct_qty
    WHERE id = v_batch.id;

    -- Registrar movimiento EXIT en el kardex asociado a este lote
    INSERT INTO kardex_movements (
      product_id, batch_id, type, quantity, unit_cost, reference_doc, created_by
    ) VALUES (
      p_product_id, v_batch.id, 'EXIT', v_deduct_qty, v_batch.unit_cost, p_reference, auth.uid()
    );

    v_remaining_qty := v_remaining_qty - v_deduct_qty;
  END LOOP;

  IF v_remaining_qty > 0 THEN
    -- Esto no debería pasar debido al chequeo inicial, pero por seguridad:
    RAISE EXCEPTION 'Inconsistencia de stock: lotes insuficientes para cubrir la cantidad solicitada.';
  END IF;

  -- Actualizar el stock total en la tabla de productos
  UPDATE products
  SET 
    current_stock = current_stock - p_quantity,
    updated_at = now()
  WHERE id = p_product_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ──────────────────────────────────────────────────────────────────────────
-- FUNCIÓN 3: register_entry(p_product_id, p_batch_id, p_quantity, p_unit_cost, p_reference)
-- Registra una entrada (ENTRY), actualiza el lote, el kardex, y el producto
-- (stock y costo promedio ponderado).
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION register_entry(
  p_product_id uuid,
  p_batch_id uuid,
  p_quantity int,
  p_unit_cost numeric(12,2),
  p_reference text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_new_avg_cost numeric(12,2);
BEGIN
  -- 1. Insertar movimiento en kardex
  INSERT INTO kardex_movements (
    product_id, batch_id, type, quantity, unit_cost, reference_doc, created_by
  ) VALUES (
    p_product_id, p_batch_id, 'ENTRY', p_quantity, p_unit_cost, p_reference, auth.uid()
  );

  -- 2. La cantidad del lote ya debió ser insertada/actualizada con p_quantity por quien llama,
  -- pero en caso de que esta función deba sumar cantidad al lote (como lo pide el prompt:
  -- "Actualiza product_batches.quantity sumando p_quantity"), lo hacemos:
  UPDATE product_batches
  SET quantity = quantity + p_quantity
  WHERE id = p_batch_id;

  -- 3. Calcular el nuevo costo promedio ponderado
  v_new_avg_cost := apply_weighted_average_cost(p_product_id);

  -- 4. Actualizar stock y costo promedio en el producto
  UPDATE products
  SET 
    current_stock = current_stock + p_quantity,
    cost_price = v_new_avg_cost,
    updated_at = now()
  WHERE id = p_product_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ──────────────────────────────────────────────────────────────────────────
-- VISTAS ADICIONALES
-- ──────────────────────────────────────────────────────────────────────────

-- Vista: products_low_stock
CREATE OR REPLACE VIEW products_low_stock AS
SELECT 
  p.id, p.code_qr_bar, p.name, p.current_stock, p.min_stock, 
  p.cost_price, p.sale_price,
  c.name AS category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.current_stock <= p.min_stock;

-- Vista: batches_expiring_soon
CREATE OR REPLACE VIEW batches_expiring_soon AS
SELECT 
  pb.id AS batch_id, pb.batch_code, pb.quantity, pb.expiry_date, pb.location,
  p.id AS product_id, p.name AS product_name, p.code_qr_bar
FROM product_batches pb
JOIN products p ON pb.product_id = p.id
WHERE pb.quantity > 0 
  AND pb.expiry_date <= (CURRENT_DATE + interval '30 days')
ORDER BY pb.expiry_date ASC;

-- Vista: inventory_valuation
CREATE OR REPLACE VIEW inventory_valuation AS
SELECT 
  p.id, p.name, p.current_stock, p.cost_price,
  (p.current_stock * p.cost_price) AS total_value,
  c.name AS category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY total_value DESC;
