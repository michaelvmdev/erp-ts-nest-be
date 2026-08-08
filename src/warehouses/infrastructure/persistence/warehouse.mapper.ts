import { Warehouse } from '../../domain/warehouse';
import { WarehouseCode } from '../../domain/value-objects/warehouse-code.value-object';
import { WarehouseDescription } from '../../domain/value-objects/warehouse-description.value-object';
import { WarehouseId } from '../../domain/value-objects/warehouse-id.value-object';
import { WarehouseOrmEntity } from './warehouse.orm-entity';

export class WarehouseMapper {
  static toDomain(row: WarehouseOrmEntity): Warehouse {
    return Warehouse.rehydrate({
      id: WarehouseId.of(row.warehouseId),
      code: WarehouseCode.of(row.warehouseCode),
      description: WarehouseDescription.of(row.warehouseDescription),
      active: row.warehouseActive,
    });
  }

  static toPersistence(warehouse: Warehouse): WarehouseOrmEntity {
    const snapshot = warehouse.toSnapshot();

    const row = new WarehouseOrmEntity();
    row.warehouseId = snapshot.id;
    row.warehouseCode = snapshot.code;
    row.warehouseDescription = snapshot.description;
    row.warehouseActive = snapshot.active;
    return row;
  }
}
