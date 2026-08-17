-- ===========================================================================
--  erp-ts-nest-be  |  Devoluciones de compra
--
--  Crea las tablas purchase_returns y purchase_return_details, la secuencia
--  de numeracion DPC-xxxxxxxxxx y extiende el CHECK constraint de
--  stock_movements para aceptar el nuevo tipo 'purchase_return'.
--
--  Reejecutable: usa IF NOT EXISTS / DO NOTHING donde corresponde.
-- ===========================================================================

-- 1. Secuencia para numeracion de devoluciones
CREATE SEQUENCE IF NOT EXISTS seq_purchase_return_number
  START 1 INCREMENT 1 MINVALUE 1 NO MAXVALUE;

-- 2. Tabla cabecera
CREATE TABLE IF NOT EXISTS purchase_returns (
  purchase_return_id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id          UUID        NOT NULL REFERENCES purchases(purchase_id),
  purchase_return_number VARCHAR(14) NOT NULL UNIQUE,
  return_date          DATE        NOT NULL,
  return_hour          TIME        NOT NULL,
  reason               VARCHAR(500) NOT NULL,
  sub_total            NUMERIC(12,2) NOT NULL CHECK (sub_total >= 0),
  igv                  NUMERIC(12,2) NOT NULL CHECK (igv >= 0),
  total                NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  deleted_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_purchase_returns_purchase_id
  ON purchase_returns (purchase_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_returns_return_date
  ON purchase_returns (return_date DESC)
  WHERE deleted_at IS NULL;

-- 3. Tabla detalle
CREATE TABLE IF NOT EXISTS purchase_return_details (
  purchase_return_id  UUID    NOT NULL REFERENCES purchase_returns(purchase_return_id),
  item                INT     NOT NULL CHECK (item >= 1),
  product_id          UUID    NOT NULL REFERENCES products(product_id),
  quantity            INT     NOT NULL CHECK (quantity >= 1),
  unit_cost           NUMERIC(12,2) NOT NULL CHECK (unit_cost >= 0),
  partial             NUMERIC(12,2) NOT NULL CHECK (partial >= 0),
  PRIMARY KEY (purchase_return_id, item)
);

-- 4. Extender el CHECK constraint de stock_movements para incluir 'purchase_return'
--    La estrategia es: eliminar el constraint existente y recrearlo ampliado.
--    Si el constraint no existe con ese nombre se usa DO/EXCEPTION para evitar error.

DO $$
BEGIN
  -- Eliminar el constraint anterior si existe
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'stock_movements'
      AND constraint_name = 'stock_movements_movement_type_check'
  ) THEN
    ALTER TABLE stock_movements
      DROP CONSTRAINT stock_movements_movement_type_check;
  END IF;

  -- Recrear con el nuevo valor
  ALTER TABLE stock_movements
    ADD CONSTRAINT stock_movements_movement_type_check
    CHECK (movement_type IN ('purchase_in', 'sale_out', 'return_in', 'purchase_return', 'adjustment'));
END;
$$;
