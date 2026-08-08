import { Inject, Injectable } from '@nestjs/common';
import { Warehouse } from '../domain/warehouse';
import { WarehouseNotFoundError } from '../domain/warehouse.errors';
import { WAREHOUSE_REPOSITORY } from '../domain/warehouse.repository';
import type { WarehouseRepository } from '../domain/warehouse.repository';
import { WarehouseId } from '../domain/value-objects/warehouse-id.value-object';

@Injectable()
export class FindWarehouseUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouses: WarehouseRepository,
  ) {}

  async execute(rawWarehouseId: string): Promise<Warehouse> {
    const id = WarehouseId.of(rawWarehouseId);
    const warehouse = await this.warehouses.findById(id);
    if (!warehouse) {
      throw new WarehouseNotFoundError(id.value);
    }
    return warehouse;
  }
}
