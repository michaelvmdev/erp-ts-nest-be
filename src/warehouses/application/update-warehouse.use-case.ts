import { Inject, Injectable } from '@nestjs/common';
import { Warehouse } from '../domain/warehouse';
import { WarehouseNotFoundError } from '../domain/warehouse.errors';
import { WAREHOUSE_REPOSITORY } from '../domain/warehouse.repository';
import type { WarehouseRepository } from '../domain/warehouse.repository';
import { WarehouseDescription } from '../domain/value-objects/warehouse-description.value-object';
import { WarehouseId } from '../domain/value-objects/warehouse-id.value-object';
import { UpdateWarehouseCommand } from './warehouse.commands';

@Injectable()
export class UpdateWarehouseUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouses: WarehouseRepository,
  ) {}

  async execute(rawWarehouseId: string, command: UpdateWarehouseCommand): Promise<Warehouse> {
    const id = WarehouseId.of(rawWarehouseId);

    const warehouse = await this.warehouses.findById(id);
    if (!warehouse) {
      throw new WarehouseNotFoundError(id.value);
    }

    if (command.warehouseDescription !== undefined) {
      warehouse.changeDescription(WarehouseDescription.of(command.warehouseDescription));
    }

    if (command.warehouseActive !== undefined) {
      if (command.warehouseActive) {
        warehouse.activate();
      } else {
        warehouse.deactivate();
      }
    }

    await this.warehouses.update(warehouse);
    return warehouse;
  }
}
