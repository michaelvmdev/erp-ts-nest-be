import { Inject, Injectable } from '@nestjs/common';
import { Page } from '../../shared/domain/pagination';
import { Warehouse } from '../domain/warehouse';
import { WarehouseSearchCriteria } from '../domain/warehouse-search.criteria';
import { WAREHOUSE_REPOSITORY } from '../domain/warehouse.repository';
import type { WarehouseRepository } from '../domain/warehouse.repository';
import { ListWarehousesQuery } from './warehouse.commands';

@Injectable()
export class ListWarehousesUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouses: WarehouseRepository,
  ) {}

  async execute(query: ListWarehousesQuery): Promise<Page<Warehouse>> {
    const criteria = WarehouseSearchCriteria.of({
      code: query.warehouseCode,
      description: query.warehouseDescription,
      active: query.warehouseActive ?? null,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return this.warehouses.search(criteria);
  }
}
