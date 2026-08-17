-- Bloque 1: Soft deletes (deleted_at) + IGV rate en productos
-- Ejecutar una sola vez sobre la base existente.

-- ── Soft deletes ─────────────────────────────────────────────────────────────
ALTER TABLE clients          ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE suppliers        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE brands           ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE categories       ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE products         ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE units            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE warehouses       ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE price_lists      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE users            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE credit_notes     ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE purchase_orders  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Indices para que las consultas con deleted_at IS NULL sean eficientes
-- (columna de tipo TIMESTAMPTZ nula → el índice parcial cubre todos los registros activos)
CREATE INDEX IF NOT EXISTS idx_clients_not_deleted        ON clients        (client_id)         WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_suppliers_not_deleted      ON suppliers      (supplier_id)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_brands_not_deleted         ON brands         (brand_id)          WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_categories_not_deleted     ON categories     (category_id)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_not_deleted       ON products       (product_id)        WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_units_not_deleted          ON units          (unit_id)           WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_warehouses_not_deleted     ON warehouses     (warehouse_id)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_price_lists_not_deleted    ON price_lists    (price_list_id)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_not_deleted          ON users          (user_id)           WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_credit_notes_not_deleted   ON credit_notes   (credit_note_id)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_purchase_orders_not_deleted ON purchase_orders (purchase_order_id) WHERE deleted_at IS NULL;

-- ── IGV rate en productos ─────────────────────────────────────────────────────
-- Tasa de IGV por producto (0.18 = 18 %, valor por defecto peruano).
-- numeric(5,4) almacena hasta 9.9999, mas que suficiente para cualquier tasa.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS igv_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.18;
