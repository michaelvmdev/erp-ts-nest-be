import { Inject, Injectable } from '@nestjs/common';
import { Money } from '../../shared/domain/money.value-object';
import { Page } from '../../shared/domain/pagination';
import { SupplierId } from '../../suppliers/domain/value-objects/supplier-id.value-object';
import {
  DateRange,
  PurchaseSearchCriteria,
  TotalRange,
} from '../domain/purchase-search.criteria';
import { PURCHASE_REPOSITORY } from '../domain/purchase.repository';
import type {
  PurchaseRepository,
  PurchaseSummary,
} from '../domain/purchase.repository';
import { SearchPurchasesQuery } from './purchase.commands';

@Injectable()
export class SearchPurchasesUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly purchases: PurchaseRepository,
  ) {}

  async execute(query: SearchPurchasesQuery): Promise<Page<PurchaseSummary>> {
    const criteria = PurchaseSearchCriteria.of({
      supplierId: query.supplierId ? SupplierId.of(query.supplierId) : null,
      dates: DateRange.of(query.dateFrom, query.dateTo),
      totals: TotalRange.of(
        query.totalMin != null ? Money.fromNumber(query.totalMin) : null,
        query.totalMax != null ? Money.fromNumber(query.totalMax) : null,
      ),
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return this.purchases.search(criteria);
  }
}
