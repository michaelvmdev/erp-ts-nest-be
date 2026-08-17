import { Money } from '../../shared/domain/money.value-object';
import { Page } from '../../shared/domain/pagination';
import { PurchaseReturn } from './purchase-return';
import { PurchaseReturnId } from './value-objects/purchase-return-id.value-object';

export interface PurchaseReturnSummary {
  readonly id: string;
  readonly purchaseId: string;
  readonly number: string;
  readonly date: string;
  readonly hour: string;
  readonly reason: string;
  readonly subTotal: Money;
  readonly igv: Money;
  readonly total: Money;
  readonly lineCount: number;
}

export interface PurchaseReturnSearchCriteria {
  readonly purchaseId?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly page: { page: number; limit: number; offset: number };
}

export interface PurchaseReturnRepository {
  findById(id: PurchaseReturnId): Promise<PurchaseReturn | null>;
  search(criteria: PurchaseReturnSearchCriteria): Promise<Page<PurchaseReturnSummary>>;
  emit(purchaseId: string, armar: (numero: string) => PurchaseReturn): Promise<PurchaseReturn>;
}

export interface PurchaseReturnCatalog {
  purchaseExists(purchaseId: string): Promise<boolean>;
  purchaseLinesMap(purchaseId: string): Promise<Map<string, { unitCost: Money }>>;
}

export const PURCHASE_RETURN_REPOSITORY = Symbol('PurchaseReturnRepository');
export const PURCHASE_RETURN_CATALOG = Symbol('PurchaseReturnCatalog');
