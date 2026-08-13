export const STOCK_WRITER = Symbol('StockWriter');

export interface StockMovementEntry {
  productId: string;
  warehouseId: string;
  movementType: 'purchase_in' | 'sale_out' | 'return_in' | 'adjustment';
  /** Positive = stock in, negative = stock out. */
  quantity: number;
  unitCost?: number | null;
  referenceId?: string | null;
}

export interface StockWriter {
  insertMovements(movements: StockMovementEntry[]): Promise<void>;
}
