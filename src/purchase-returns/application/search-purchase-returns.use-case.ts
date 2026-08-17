import { Inject, Injectable } from '@nestjs/common';
import { Page, PageRequest } from '../../shared/domain/pagination';
import { PurchaseReturnSummary } from '../domain/purchase-return.repository';
import { PURCHASE_RETURN_REPOSITORY } from '../domain/purchase-return.repository';
import type { PurchaseReturnRepository } from '../domain/purchase-return.repository';

export interface SearchPurchaseReturnsQuery {
  purchaseId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class SearchPurchaseReturnsUseCase {
  constructor(
    @Inject(PURCHASE_RETURN_REPOSITORY)
    private readonly purchaseReturns: PurchaseReturnRepository,
  ) {}

  async execute(query: SearchPurchaseReturnsQuery): Promise<Page<PurchaseReturnSummary>> {
    const pageRequest = PageRequest.of(query.page, query.limit);
    return this.purchaseReturns.search({
      purchaseId: query.purchaseId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: { page: pageRequest.page, limit: pageRequest.limit, offset: pageRequest.offset },
    });
  }
}
