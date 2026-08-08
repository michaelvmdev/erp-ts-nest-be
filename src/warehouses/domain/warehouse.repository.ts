import type { Page } from '../../shared/domain/pagination';
import type { Warehouse } from './warehouse';
import type { WarehouseSearchCriteria } from './warehouse-search.criteria';
import type { WarehouseCode } from './value-objects/warehouse-code.value-object';
import type { WarehouseId } from './value-objects/warehouse-id.value-object';

export const WAREHOUSE_REPOSITORY = Symbol('WAREHOUSE_REPOSITORY');

export interface WarehouseRepository {
  findById(id: WarehouseId): Promise<Warehouse | null>;
  findByCode(code: WarehouseCode, excludeId?: WarehouseId): Promise<Warehouse | null>;
  search(criteria: WarehouseSearchCriteria): Promise<Page<Warehouse>>;
  insert(warehouse: Warehouse): Promise<void>;
  update(warehouse: Warehouse): Promise<void>;
}
