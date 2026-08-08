import { Inject, Injectable } from '@nestjs/common';
import { Page, PageRequest } from '../../shared/domain/pagination';
import { PurchaseOrderSummary } from '../domain/purchase-order.repository';
import { PURCHASE_ORDER_REPOSITORY } from '../domain/purchase-order.repository';
import type { PurchaseOrderRepository } from '../domain/purchase-order.repository';
import { SearchPurchaseOrdersQuery } from './purchase-order.commands';

@Injectable()
export class SearchPurchaseOrdersUseCase {
  constructor(
    @Inject(PURCHASE_ORDER_REPOSITORY)
    private readonly orders: PurchaseOrderRepository,
  ) {}

  async execute(query: SearchPurchaseOrdersQuery): Promise<Page<PurchaseOrderSummary>> {
    const pageRequest = PageRequest.of(query.page, query.limit);
    return this.orders.search({
      supplierId: query.supplierId,
      status: query.status,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: { page: pageRequest.page, limit: pageRequest.limit, offset: pageRequest.offset },
    });
  }
}
