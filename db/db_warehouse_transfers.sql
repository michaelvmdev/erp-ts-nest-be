-- Migration: Add transfer_out and transfer_in to stock movement type check constraint
-- Also update purchase_returns constraint if not already applied (idempotent via DROP + recreate)

ALTER TABLE stock_movements
  DROP CONSTRAINT IF EXISTS stock_movements_movement_type_check;

ALTER TABLE stock_movements
  ADD CONSTRAINT stock_movements_movement_type_check
  CHECK (movement_type IN (
    'purchase_in',
    'sale_out',
    'return_in',
    'purchase_return',
    'transfer_out',
    'transfer_in',
    'adjustment'
  ));
