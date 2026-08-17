-- Migration: Lotes y vencimientos

CREATE TABLE lots (
  lot_id              UUID         PRIMARY KEY,
  lot_number          VARCHAR(50)  NOT NULL,
  product_id          UUID         NOT NULL REFERENCES products(product_id),
  warehouse_id        UUID         NOT NULL REFERENCES warehouses(warehouse_id),
  manufacturing_date  DATE,
  expiration_date     DATE         NOT NULL,
  initial_quantity    INT          NOT NULL CHECK (initial_quantity > 0),
  current_quantity    INT          NOT NULL,
  status              VARCHAR(20)  NOT NULL DEFAULT 'active'
                        CONSTRAINT lots_status_check
                        CHECK (status IN ('active', 'depleted', 'expired')),
  notes               TEXT,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT lots_dates_check CHECK (
    manufacturing_date IS NULL OR manufacturing_date < expiration_date
  )
);

CREATE INDEX idx_lots_product_id      ON lots(product_id);
CREATE INDEX idx_lots_warehouse_id    ON lots(warehouse_id);
CREATE INDEX idx_lots_expiration_date ON lots(expiration_date);
CREATE INDEX idx_lots_status          ON lots(status);

-- Columna opcional en stock_movements para trazar qué lote originó el movimiento
ALTER TABLE stock_movements
  ADD COLUMN IF NOT EXISTS lot_id UUID REFERENCES lots(lot_id);
