import { Page } from '../../shared/domain/pagination';
import { Lot, LotStatus } from './lot';
import { LotId } from './value-objects/lot-id.value-object';

export interface LotSummary {
  readonly id: string;
  readonly lotNumber: string;
  readonly productId: string;
  readonly productName: string;
  readonly warehouseId: string;
  readonly warehouseCode: string;
  readonly expirationDate: string;
  readonly initialQuantity: number;
  readonly currentQuantity: number;
  readonly status: LotStatus;
  readonly createdAt: Date;
}

export interface LotSearchCriteria {
  productId?: string;
  warehouseId?: string;
  status?: LotStatus;
  expiringBeforeDate?: string;
  page?: number;
  limit?: number;
}

export interface LotRepository {
  findById(id: LotId): Promise<Lot | null>;
  search(criteria: LotSearchCriteria): Promise<Page<LotSummary>>;
  save(lot: Lot): Promise<void>;
}

export const LOT_REPOSITORY = Symbol('LotRepository');
