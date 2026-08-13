import { PurchaseOrderStatus } from '../domain/purchase-order';

export interface PurchaseOrderLineCommand {
  readonly productId: string;
  readonly quantityOrdered: number;
  readonly unitPrice: number;
}

export interface CreatePurchaseOrderCommand {
  readonly supplierId: string;
  readonly date: string;
  readonly notes?: string;
  readonly lines: readonly PurchaseOrderLineCommand[];
}

export interface UpdatePurchaseOrderCommand {
  readonly status?: PurchaseOrderStatus;
  readonly notes?: string | null;
  readonly warehouseId?: string;
}

export interface SearchPurchaseOrdersQuery {
  readonly supplierId?: string;
  readonly status?: PurchaseOrderStatus;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly page?: number;
  readonly limit?: number;
}
