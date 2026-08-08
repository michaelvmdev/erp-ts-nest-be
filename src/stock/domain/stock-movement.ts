export type StockMovementType = 'purchase_in' | 'sale_out' | 'return_in' | 'adjustment';

export interface StockMovement {
  readonly movementId: string;
  readonly productId: string;
  readonly productName: string;
  readonly warehouseId: string;
  readonly warehouseCode: string;
  readonly movementType: StockMovementType;
  readonly quantity: number;
  readonly unitCost: number | null;
  readonly notes: string | null;
  readonly referenceId: string | null;
  readonly createdAt: Date;
}
