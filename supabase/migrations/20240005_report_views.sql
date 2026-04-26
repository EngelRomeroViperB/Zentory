-- ══════════════════════════════════════════════════════════════════════════
-- Zentory — Migración 005: Vistas para Reportes
-- ══════════════════════════════════════════════════════════════════════════

-- VISTA 1: report_sales_by_date
CREATE OR REPLACE VIEW report_sales_by_date AS
SELECT
  DATE_TRUNC('day', s.created_at) AS fecha,
  COUNT(s.id)                     AS num_facturas,
  COUNT(DISTINCT s.client_id)     AS num_clientes,
  SUM(s.total - s.tax_amount)     AS subtotal,
  SUM(s.tax_amount)               AS iva,
  SUM(s.total)                    AS total
FROM sales s
WHERE s.status = 'ACTIVE'
GROUP BY DATE_TRUNC('day', s.created_at)
ORDER BY fecha DESC;

-- VISTA 2: report_sales_by_product
CREATE OR REPLACE VIEW report_sales_by_product AS
SELECT
  p.id            AS product_id,
  p.code_qr_bar,
  p.name          AS producto,
  c.name          AS categoria,
  SUM(si.quantity)                         AS unidades_vendidas,
  SUM(si.subtotal)                         AS ingresos,
  SUM(si.quantity * si.unit_cost)          AS costo_total,
  SUM(si.subtotal) - SUM(si.quantity * si.unit_cost) AS utilidad_bruta,
  ROUND(
    (SUM(si.subtotal) - SUM(si.quantity * si.unit_cost))
    / NULLIF(SUM(si.subtotal), 0) * 100, 2
  )                                        AS margen_pct
FROM sale_items si
JOIN products p  ON p.id = si.product_id
LEFT JOIN categories c ON c.id = p.category_id
JOIN sales s     ON s.id = si.sale_id
WHERE s.status = 'ACTIVE'
GROUP BY p.id, p.code_qr_bar, p.name, c.name
ORDER BY ingresos DESC;

-- VISTA 3: report_sales_by_client
CREATE OR REPLACE VIEW report_sales_by_client AS
SELECT
  cl.id           AS client_id,
  cl.name         AS cliente,
  cl.nit,
  COUNT(s.id)     AS num_compras,
  SUM(s.total)    AS total_comprado,
  AVG(s.total)    AS ticket_promedio,
  MAX(s.created_at) AS ultima_compra
FROM sales s
JOIN clients cl ON cl.id = s.client_id
WHERE s.status = 'ACTIVE'
GROUP BY cl.id, cl.name, cl.nit
ORDER BY total_comprado DESC;

-- VISTA 4: report_libro_ventas
CREATE OR REPLACE VIEW report_libro_ventas AS
SELECT
  s.invoice_number,
  s.created_at::date              AS fecha,
  cl.name                         AS cliente,
  cl.nit                          AS nit_cliente,
  s.total - s.tax_amount          AS base_imponible,
  s.tax_amount                    AS iva,
  s.total                         AS total,
  s.status
FROM sales s
LEFT JOIN clients cl ON cl.id = s.client_id
ORDER BY s.created_at;

-- VISTA 5: report_devoluciones
CREATE OR REPLACE VIEW report_devoluciones AS
SELECT
  s.invoice_number,
  s.created_at::date              AS fecha_venta,
  s.updated_at::date              AS fecha_anulacion,
  cl.name                         AS cliente,
  s.total,
  s.notes                         AS motivo,
  u.email                         AS anulado_por
FROM sales s
LEFT JOIN clients cl              ON cl.id = s.client_id
LEFT JOIN auth.users u            ON u.id = s.vendedor_id
WHERE s.status = 'DELETED'
ORDER BY s.updated_at DESC;

-- VISTA 6: report_purchases_by_supplier
CREATE OR REPLACE VIEW report_purchases_by_supplier AS
SELECT
  sup.id              AS supplier_id,
  sup.name            AS proveedor,
  sup.nit,
  COUNT(p.id)         AS num_compras,
  SUM(p.total)        AS total_comprado,
  SUM(p.tax_amount)   AS iva_total,
  MAX(p.created_at)   AS ultima_compra
FROM purchases p
JOIN suppliers sup ON sup.id = p.supplier_id
WHERE p.status = 'ACTIVE'
GROUP BY sup.id, sup.name, sup.nit
ORDER BY total_comprado DESC;

-- VISTA 7: report_cost_variation
CREATE OR REPLACE VIEW report_cost_variation AS
SELECT
  prod.id             AS product_id,
  prod.name           AS producto,
  sup.name            AS proveedor,
  pi.unit_cost        AS costo,
  pu.created_at       AS fecha_compra,
  LAG(pi.unit_cost) OVER (
    PARTITION BY pi.product_id ORDER BY pu.created_at
  )                   AS costo_anterior,
  ROUND(
    (pi.unit_cost - LAG(pi.unit_cost) OVER (
      PARTITION BY pi.product_id ORDER BY pu.created_at
    )) / NULLIF(LAG(pi.unit_cost) OVER (
      PARTITION BY pi.product_id ORDER BY pu.created_at
    ), 0) * 100, 2
  )                   AS variacion_pct
FROM purchase_items pi
JOIN purchases  pu   ON pu.id  = pi.purchase_id
JOIN products   prod ON prod.id = pi.product_id
LEFT JOIN suppliers sup ON sup.id = pu.supplier_id
ORDER BY prod.name, pu.created_at;

-- VISTA 8: report_libro_compras
CREATE OR REPLACE VIEW report_libro_compras AS
SELECT
  pu.invoice_number,
  pu.created_at::date             AS fecha,
  sup.name                        AS proveedor,
  sup.nit                         AS nit_proveedor,
  pu.total - pu.tax_amount        AS base_imponible,
  pu.tax_amount                   AS iva,
  pu.total                        AS total,
  pu.status
FROM purchases pu
LEFT JOIN suppliers sup ON sup.id = pu.supplier_id
ORDER BY pu.created_at;
