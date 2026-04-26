-- ══════════════════════════════════════════════════════════════════════════
-- Zentory — Migración 002: Row Level Security (RLS)
-- Idempotente: las políticas usan OR REPLACE o DROP IF EXISTS + CREATE.
-- ══════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- FUNCIÓN HELPER get_my_role()
-- SECURITY DEFINER + STABLE permite que PostgreSQL la cachee por transacción
-- sin re-ejecutar el SELECT en cada fila evaluada por RLS, reduciendo el
-- overhead de las políticas en tablas grandes.
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;


-- ══════════════════════════════════════════════════════════════════════════
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ══════════════════════════════════════════════════════════════════════════
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_batches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE kardex_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases        ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_queue      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles       ENABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════════════════════════════════
-- HELPER: eliminar política si existe antes de recrearla (idempotencia)
-- ══════════════════════════════════════════════════════════════════════════
-- Usamos DROP IF EXISTS + CREATE en lugar de CREATE OR REPLACE porque
-- PostgreSQL no soporta OR REPLACE para políticas RLS.


-- ══════════════════════════════════════════════════════════════════════════
-- categories — todos leen; solo admin y bodeguero escriben
-- ══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "categories_select_all"  ON categories;
DROP POLICY IF EXISTS "categories_write_admin_bodeguero" ON categories;

CREATE POLICY "categories_select_all"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "categories_write_admin_bodeguero"
  ON categories FOR ALL
  TO authenticated
  USING    (get_my_role() IN ('admin', 'bodeguero'))
  WITH CHECK (get_my_role() IN ('admin', 'bodeguero'));


-- ══════════════════════════════════════════════════════════════════════════
-- suppliers — todos leen; solo admin y bodeguero escriben
-- ══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "suppliers_select_all"           ON suppliers;
DROP POLICY IF EXISTS "suppliers_write_admin_bodeguero" ON suppliers;

CREATE POLICY "suppliers_select_all"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "suppliers_write_admin_bodeguero"
  ON suppliers FOR ALL
  TO authenticated
  USING    (get_my_role() IN ('admin', 'bodeguero'))
  WITH CHECK (get_my_role() IN ('admin', 'bodeguero'));


-- ══════════════════════════════════════════════════════════════════════════
-- products — todos leen; admin y bodeguero crean/editan
-- ══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "products_select_authenticated"   ON products;
DROP POLICY IF EXISTS "products_write_admin_bodeguero"  ON products;

CREATE POLICY "products_select_authenticated"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "products_write_admin_bodeguero"
  ON products FOR ALL
  TO authenticated
  USING    (get_my_role() IN ('admin', 'bodeguero'))
  WITH CHECK (get_my_role() IN ('admin', 'bodeguero'));


-- ══════════════════════════════════════════════════════════════════════════
-- product_batches — todos leen; admin y bodeguero crean/editan
-- ══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "batches_select_authenticated"   ON product_batches;
DROP POLICY IF EXISTS "batches_write_admin_bodeguero"  ON product_batches;

CREATE POLICY "batches_select_authenticated"
  ON product_batches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "batches_write_admin_bodeguero"
  ON product_batches FOR ALL
  TO authenticated
  USING    (get_my_role() IN ('admin', 'bodeguero'))
  WITH CHECK (get_my_role() IN ('admin', 'bodeguero'));


-- ══════════════════════════════════════════════════════════════════════════
-- kardex_movements — todos leen; admin y bodeguero insertan; nadie borra
-- Se separan SELECT e INSERT en políticas distintas para denegar DELETE/UPDATE
-- implícitamente (RLS por defecto niega lo que no está explícitamente permitido).
-- ══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "kardex_select_authenticated"   ON kardex_movements;
DROP POLICY IF EXISTS "kardex_insert_admin_bodeguero" ON kardex_movements;

CREATE POLICY "kardex_select_authenticated"
  ON kardex_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "kardex_insert_admin_bodeguero"
  ON kardex_movements FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'bodeguero'));


-- ══════════════════════════════════════════════════════════════════════════
-- sales
-- vendedor: inserta las suyas y lee solo las suyas
-- admin: lee y modifica todas
-- ══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "sales_select_own_or_admin"  ON sales;
DROP POLICY IF EXISTS "sales_insert_vendedor"       ON sales;
DROP POLICY IF EXISTS "sales_update_admin"          ON sales;

-- Lectura: vendedor ve sus propias ventas; admin ve todo
CREATE POLICY "sales_select_own_or_admin"
  ON sales FOR SELECT
  TO authenticated
  USING (
    vendedor_id = auth.uid()
    OR get_my_role() = 'admin'
  );

-- Inserción: cualquier autenticado puede insertar, pero solo como vendedor_id propio
CREATE POLICY "sales_insert_vendedor"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (vendedor_id = auth.uid());

-- Modificación: solo admin puede actualizar ventas
CREATE POLICY "sales_update_admin"
  ON sales FOR UPDATE
  TO authenticated
  USING    (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');


-- ══════════════════════════════════════════════════════════════════════════
-- sale_items — acceso heredado de sales (el usuario puede operar sobre items
-- cuya sale_id le pertenezca o sea admin)
-- ══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "sale_items_select"  ON sale_items;
DROP POLICY IF EXISTS "sale_items_insert"  ON sale_items;
DROP POLICY IF EXISTS "sale_items_update"  ON sale_items;

CREATE POLICY "sale_items_select"
  ON sale_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales s
      WHERE s.id = sale_items.sale_id
        AND (s.vendedor_id = auth.uid() OR get_my_role() = 'admin')
    )
  );

CREATE POLICY "sale_items_insert"
  ON sale_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales s
      WHERE s.id = sale_items.sale_id
        AND s.vendedor_id = auth.uid()
    )
    OR get_my_role() = 'admin'
  );

CREATE POLICY "sale_items_update"
  ON sale_items FOR UPDATE
  TO authenticated
  USING    (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');


-- ══════════════════════════════════════════════════════════════════════════
-- purchases — bodeguero y admin tienen acceso completo
-- ══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "purchases_admin_bodeguero" ON purchases;

CREATE POLICY "purchases_admin_bodeguero"
  ON purchases FOR ALL
  TO authenticated
  USING    (get_my_role() IN ('admin', 'bodeguero'))
  WITH CHECK (get_my_role() IN ('admin', 'bodeguero'));


-- ══════════════════════════════════════════════════════════════════════════
-- purchase_items — bodeguero y admin tienen acceso completo
-- ══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "purchase_items_admin_bodeguero" ON purchase_items;

CREATE POLICY "purchase_items_admin_bodeguero"
  ON purchase_items FOR ALL
  TO authenticated
  USING    (get_my_role() IN ('admin', 'bodeguero'))
  WITH CHECK (get_my_role() IN ('admin', 'bodeguero'));


-- ══════════════════════════════════════════════════════════════════════════
-- print_queue
-- INSERT: abierto a cualquier usuario autenticado (cualquier terminal puede
--         encolar un trabajo de impresión)
-- SELECT/UPDATE: solo si device_id coincide con el setting de sesión O es admin
--   current_setting('app.device_id', true) devuelve NULL si no está seteado,
--   lo que hará que la condición falle sin error.
-- ══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "print_queue_insert_authenticated" ON print_queue;
DROP POLICY IF EXISTS "print_queue_select_device_admin"  ON print_queue;
DROP POLICY IF EXISTS "print_queue_update_device_admin"  ON print_queue;

CREATE POLICY "print_queue_insert_authenticated"
  ON print_queue FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "print_queue_select_device_admin"
  ON print_queue FOR SELECT
  TO authenticated
  USING (
    device_id = current_setting('app.device_id', true)
    OR get_my_role() = 'admin'
  );

CREATE POLICY "print_queue_update_device_admin"
  ON print_queue FOR UPDATE
  TO authenticated
  USING (
    device_id = current_setting('app.device_id', true)
    OR get_my_role() = 'admin'
  )
  WITH CHECK (
    device_id = current_setting('app.device_id', true)
    OR get_my_role() = 'admin'
  );


-- ══════════════════════════════════════════════════════════════════════════
-- user_roles
-- admin: gestión completa
-- cualquier usuario: puede leer su propio registro (necesario para que la
--   aplicación cliente conozca el rol del usuario actual)
-- ══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "user_roles_select_own"    ON user_roles;
DROP POLICY IF EXISTS "user_roles_manage_admin"  ON user_roles;

-- Cada usuario puede leer su propio registro de rol
CREATE POLICY "user_roles_select_own"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR get_my_role() = 'admin');

-- Solo admin puede crear, modificar o eliminar roles
CREATE POLICY "user_roles_manage_admin"
  ON user_roles FOR ALL
  TO authenticated
  USING    (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');
