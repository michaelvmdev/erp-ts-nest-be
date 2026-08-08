import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Warehouse } from '../domain/warehouse';
import { WarehouseCodeAlreadyExistsError } from '../domain/warehouse.errors';
import { WAREHOUSE_REPOSITORY } from '../domain/warehouse.repository';
import type { WarehouseRepository } from '../domain/warehouse.repository';
import { WarehouseCode } from '../domain/value-objects/warehouse-code.value-object';
import { WarehouseDescription } from '../domain/value-objects/warehouse-description.value-object';
import { WarehouseId } from '../domain/value-objects/warehouse-id.value-object';
import { CreateWarehouseCommand } from './warehouse.commands';

@Injectable()
export class CreateWarehouseUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouses: WarehouseRepository,
  ) {}

  async execute(command: CreateWarehouseCommand): Promise<Warehouse> {
    const code = WarehouseCode.of(command.warehouseCode);
    const description = WarehouseDescription.of(command.warehouseDescription);

    const existente = await this.warehouses.findByCode(code);
    if (existente) {
      throw new WarehouseCodeAlreadyExistsError(code.value);
    }

    const warehouse = Warehouse.create({
      id: WarehouseId.of(randomUUID()),
      code,
      description,
      active: command.warehouseActive,
    });

    await this.warehouses.insert(warehouse);
    return warehouse;
  }
}
