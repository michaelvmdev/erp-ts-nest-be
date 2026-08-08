import type { Page } from '../../shared/domain/pagination';
import type { Unit } from './unit';
import type { UnitSearchCriteria } from './unit-search.criteria';
import type { UnitCode } from './value-objects/unit-code.value-object';
import type { UnitId } from './value-objects/unit-id.value-object';

export const UNIT_REPOSITORY = Symbol('UNIT_REPOSITORY');

export interface UnitRepository {
  findById(id: UnitId): Promise<Unit | null>;
  findByCode(code: UnitCode, excludeId?: UnitId): Promise<Unit | null>;
  search(criteria: UnitSearchCriteria): Promise<Page<Unit>>;
  insert(unit: Unit): Promise<void>;
  update(unit: Unit): Promise<void>;
}
