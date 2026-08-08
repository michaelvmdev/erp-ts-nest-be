export interface StockLevel {
  readonly productId: string;
  readonly productName: string;
  readonly warehouseId: string;
  readonly warehouseCode: string;
  readonly warehouseDescription: string;
  readonly quantity: number;
}
