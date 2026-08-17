export interface PurchaseReturnLineCommand {
  readonly productId: string;
  readonly quantity: number;
}

export interface CreatePurchaseReturnCommand {
  readonly purchaseId: string;
  readonly reason: string;
  readonly returnDate?: string;
  readonly returnHour?: string;
  readonly purchaseReturnDetails: PurchaseReturnLineCommand[];
  readonly warehouseId?: string;
}
