export interface CreateLotCommand {
  lotNumber: string;
  productId: string;
  warehouseId: string;
  manufacturingDate?: string;
  expirationDate: string;
  initialQuantity: number;
  notes?: string;
}
