-- ══════════════════════════════════════════════════════════════════════════
-- Zentory — Migración 001: Schema Completo
-- Idempotente: usa IF NOT EXISTS y bloques DO $$ ... EXCEPTION para evitar
-- errores si se ejecuta más de una vez sobre la misma base de datos.
-- ══════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- TIPOS ENUM
-- Usamos bloques de excepción para idempotencia: si el tipo ya existe,
-- PostgreSQL lanza duplicate_object y lo ignoramos.
-- ──────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE movement_type AS ENUM ('ENTRY', 'EXIT', 'ADJUSTMENT', 'RETURN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sale_status AS ENUM ('ACTIVE', 'DELETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE print_status AS ENUM ('PENDING', 'PRINTED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- user_role se define antes que las demás tablas porque es referenciado
-- en user_roles y en la función helper de RLS.
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'vendedor', 'bodeguero');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ──────────────────────────────────────────────────────────────────────────
-- 1. suppliers
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  nit        text,
  phone      text,
  email      text,
  created_at timestamptz DEFAULT now()
);


-- ──────────────────────────────────────────────────────────────────────────
-- 2. clients
-- El id no usa gen_random_uuid() por defecto para permitir sincronización
-- con CRM externos que provean su propio identificador.
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id         uuid PRIMARY KEY,
  name       text NOT NULL,
  nit        text,
  email      text,
  phone      text,
  created_at timestamptz DEFAULT now()
);


-- ──────────────────────────────────────────────────────────────────────────
-- 3. user_roles
-- UNIQUE(user_id) garantiza un único rol por usuario, evitando escalada
-- de privilegios por registros duplicados.
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       user_role NOT NULL DEFAULT 'vendedor',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);


-- ──────────────────────────────────────────────────────────────────────────
-- 4. categories
-- UNIQUE en name para evitar duplicados semánticos en el catálogo.
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);


-- ──────────────────────────────────────────────────────────────────────────
-- 5. products
-- expiry_date y location se omiten aquí — van en product_batches porque
-- un mismo producto puede tener múltiples lotes con distintas fechas y
-- ubicaciones de bodega.
-- numeric(12,2) — NUNCA float — para evitar errores de redondeo monetario.
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_qr_bar   text UNIQUE,
  name          text NOT NULL,
  category_id   uuid REFERENCES categories(id),
  cost_price    numeric(12,2) NOT NULL DEFAULT 0,
  sale_price    numeric(12,2) NOT NULL DEFAULT 0,
  current_stock int NOT NULL DEFAULT 0,
  min_stock     int NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);


-- ──────────────────────────────────────────────────────────────────────────
-- 6. product_batches
-- ON DELETE CASCADE: si se elimina el producto, sus lotes huérfanos también
-- se eliminan para evitar referencias inválidas en el kardex.
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_batches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_code  text,
  quantity    int NOT NULL DEFAULT 0,
  unit_cost   numeric(12,2),
  expiry_date date,
  location    text,
  created_at  timestamptz DEFAULT now()
);


-- ──────────────────────────────────────────────────────────────────────────
-- 7. kardex_movements
-- Registro inmutable de movimientos. Los saldos NO se almacenan aquí;
-- se calculan en kardex_with_balance con window functions para garantizar
-- consistencia y evitar desincronización.
-- CHECK quantity > 0: el signo lo determina `type`, no la cantidad.
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kardex_movements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES products(id),
  batch_id      uuid REFERENCES product_batches(id),
  type          movement_type NOT NULL,
  quantity      int NOT NULL CHECK (quantity > 0),
  unit_cost     numeric(12,2) NOT NULL DEFAULT 0,
  reference_doc text,
  notes         text,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now()
);


-- ──────────────────────────────────────────────────────────────────────────
-- 8. VISTA kardex_with_balance
-- ENTRY y RETURN suman; EXIT y ADJUSTMENT restan.
-- balance_value = unidades × costo para valoración de inventario.
-- OR REPLACE asegura idempotencia.
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW kardex_with_balance AS
SELECT
  km.*,
  SUM(
    CASE
      WHEN km.type IN ('ENTRY', 'RETURN')     THEN  km.quantity
      WHEN km.type IN ('EXIT', 'ADJUSTMENT')  THEN -km.quantity
    END
  ) OVER (
    PARTITION BY km.product_id
    ORDER BY km.created_at, km.id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS balance_quantity,
  SUM(
    CASE
      WHEN km.type IN ('ENTRY', 'RETURN')     THEN  km.quantity * km.unit_cost
      WHEN km.type IN ('EXIT', 'ADJUSTMENT')  THEN -(km.quantity * km.unit_cost)
    END
  ) OVER (
    PARTITION BY km.product_id
    ORDER BY km.created_at, km.id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS balance_value
FROM kardex_movements km;


-- ──────────────────────────────────────────────────────────────────────────
-- 9. Secuencia para facturas
-- Independiente del id de venta para garantizar numeración fiscal consecutiva.
-- ──────────────────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS invoice_seq START WITH 1;


-- ──────────────────────────────────────────────────────────────────────────
-- 10. sales
-- invoice_number se genera con trigger (no GENERATED AS porque now() no es immutable)
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_seq    int  UNIQUE DEFAULT nextval('invoice_seq'),
  invoice_number text,  -- Se llena con trigger
  client_id      uuid REFERENCES clients(id),
  vendedor_id    uuid REFERENCES auth.users(id),
  total          numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount     numeric(12,2) NOT NULL DEFAULT 0,
  status         sale_status NOT NULL DEFAULT 'ACTIVE',
  notes          text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- Trigger para generar invoice_number
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'FAC-' || TO_CHAR(now(), 'YYYY') || '-' || 
                        LPAD(NEW.invoice_seq::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_set_invoice_number
    BEFORE INSERT ON sales
    FOR EACH ROW EXECUTE FUNCTION set_invoice_number();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ──────────────────────────────────────────────────────────────────────────
-- 11. sale_items
-- subtotal STORED evita inconsistencias entre lo mostrado y lo almacenado.
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sale_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id      uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id   uuid NOT NULL REFERENCES products(id),
  batch_id     uuid REFERENCES product_batches(id),
  quantity     int NOT NULL CHECK (quantity > 0),
  unit_price   numeric(12,2) NOT NULL,
  unit_cost    numeric(12,2) NOT NULL DEFAULT 0,
  discount_pct numeric(5,2) NOT NULL DEFAULT 0,
  tax_rate     numeric(5,2) NOT NULL DEFAULT 0,
  subtotal     numeric(12,2) GENERATED ALWAYS AS (
    ROUND(quantity * unit_price * (1 - discount_pct / 100), 2)
  ) STORED
);


-- ──────────────────────────────────────────────────────────────────────────
-- 12. purchases
-- status como text (no enum) para permitir estados propios del proceso de
-- compra en fases posteriores sin necesidad de migrar el enum.
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id    uuid REFERENCES suppliers(id),
  invoice_number text,
  total          numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount     numeric(12,2) NOT NULL DEFAULT 0,
  status         text NOT NULL DEFAULT 'ACTIVE',
  notes          text,
  created_by     uuid REFERENCES auth.users(id),
  created_at     timestamptz DEFAULT now()
);


-- ──────────────────────────────────────────────────────────────────────────
-- 13. purchase_items
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES products(id),
  batch_id    uuid REFERENCES product_batches(id),
  quantity    int NOT NULL CHECK (quantity > 0),
  unit_cost   numeric(12,2) NOT NULL
);


-- ──────────────────────────────────────────────────────────────────────────
-- 14. print_queue
-- Cola poll-based: el dispositivo filtra por device_id, reclama el trabajo
-- (claimed_at) e informa resultado (printed_at / status FAILED).
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS print_queue (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content    jsonb NOT NULL,
  status     print_status NOT NULL DEFAULT 'PENDING',
  device_id  text,
  created_at timestamptz DEFAULT now(),
  claimed_at timestamptz,
  printed_at timestamptz
);


-- ──────────────────────────────────────────────────────────────────────────
-- TRIGGERS updated_at
-- OR REPLACE en la función garantiza idempotencia.
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
