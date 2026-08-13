-- Corrige el CHECK de purchase_order_status: reemplaza 'completed' por 'received'.
-- Se deben migrar los registros antes de recrear la restricción.

UPDATE purchase_orders
  SET purchase_order_status = 'received'
  WHERE purchase_order_status = 'completed';

ALTER TABLE purchase_orders
  DROP CONSTRAINT IF EXISTS purchase_orders_purchase_order_status_check;

ALTER TABLE purchase_orders
  ADD CONSTRAINT purchase_orders_purchase_order_status_check
    CHECK (purchase_order_status IN ('pending', 'partial', 'received', 'cancelled'));
