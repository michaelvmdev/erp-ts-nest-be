-- Agrega la columna minimum_stock a products.
-- Productos ya existentes quedan con 0 (sin stock mínimo definido).
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS minimum_stock INTEGER NOT NULL DEFAULT 0;
