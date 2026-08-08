import { Page } from '../../shared/domain/pagination';
import { PurchaseOrder, PurchaseOrderStatus } from './purchase-order';
import { PurchaseOrderId } from './value-objects/purchase-order-id.value-object';
import { Money } from '../../shared/domain/money.value-object';

export interface PurchaseOrderSummary {
  readonly id: string;
  readonly supplierId: string;
  readonly date: string;
  readonly status: PurchaseOrderStatus;
  readonly notes: string | null;
  readonly subTotal: Money;
  readonly igv: Money;
  readonly total: Money;
  readonly lineCount: number;
}

export interface PurchaseOrderSearchCriteria {
  readonly supplierId?: string;
  readonly status?: PurchaseOrderStatus;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly page: { page: number; limit: number; offset: number };
}

export interface PurchaseOrderRepository {
  findById(id: PurchaseOrderId): Promise<PurchaseOrder | null>;
  search(criteria: PurchaseOrderSearchCriteria): Promise<Page<PurchaseOrderSummary>>;
  insert(order: PurchaseOrder): Promise<void>;
  update(order: PurchaseOrder): Promise<void>;
}

export interface PurchaseOrderCatalog {
  supplierExists(supplierId: string): Promise<boolean>;
  productsExist(productIds: readonly string[]): Promise<Set<string>>;
}

export const PURCHASE_ORDER_REPOSITORY = Symbol('PurchaseOrderRepository');
export const PURCHASE_ORDER_CATALOG = Symbol('PurchaseOrderCatalog');
