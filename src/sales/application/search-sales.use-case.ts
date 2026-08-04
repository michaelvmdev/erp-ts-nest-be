import { Inject, Injectable } from '@nestjs/common';
import { ClientId } from '../../clients/domain/value-objects/client-id.value-object';
import { Money } from '../../shared/domain/money.value-object';
import { Page } from '../../shared/domain/pagination';
import {
  DateRange,
  SaleSearchCriteria,
  TotalRange,
} from '../domain/sale-search.criteria';
import { SALE_REPOSITORY } from '../domain/sale.repository';
import type { SaleRepository, SaleSummary } from '../domain/sale.repository';
import { SearchSalesQuery } from './sale.commands';

@Injectable()
export class SearchSalesUseCase {
  constructor(
    @Inject(SALE_REPOSITORY)
    private readonly sales: SaleRepository,
  ) {}

  async execute(query: SearchSalesQuery): Promise<Page<SaleSummary>> {
    const criteria = SaleSearchCriteria.of({
      saleNumber: query.saleNumber,
      saleTypeCode: query.saleTypeCode,
      clientId: query.clientId ? ClientId.of(query.clientId) : null,
      districtId: query.districtId,
      departmentId: query.departmentId,
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

    return this.sales.search(criteria);
  }
}
