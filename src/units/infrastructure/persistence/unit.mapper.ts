import { Unit } from '../../domain/unit';
import { UnitCode } from '../../domain/value-objects/unit-code.value-object';
import { UnitDescription } from '../../domain/value-objects/unit-description.value-object';
import { UnitId } from '../../domain/value-objects/unit-id.value-object';
import { UnitOrmEntity } from './unit.orm-entity';

export class UnitMapper {
  static toDomain(row: UnitOrmEntity): Unit {
    return Unit.rehydrate({
      id: UnitId.of(row.unitId),
      code: UnitCode.of(row.unitCode),
      description: UnitDescription.of(row.unitDescription),
      active: row.unitActive,
    });
  }

  static toPersistence(unit: Unit): UnitOrmEntity {
    const snapshot = unit.toSnapshot();

    const row = new UnitOrmEntity();
    row.unitId = snapshot.id;
    row.unitCode = snapshot.code;
    row.unitDescription = snapshot.description;
    row.unitActive = snapshot.active;
    return row;
  }
}
