import { Inject, Injectable } from '@nestjs/common';
import { Unit } from '../domain/unit';
import { UnitNotFoundError } from '../domain/unit.errors';
import { UNIT_REPOSITORY } from '../domain/unit.repository';
import type { UnitRepository } from '../domain/unit.repository';
import { UnitDescription } from '../domain/value-objects/unit-description.value-object';
import { UnitId } from '../domain/value-objects/unit-id.value-object';
import { UpdateUnitCommand } from './unit.commands';

@Injectable()
export class UpdateUnitUseCase {
  constructor(
    @Inject(UNIT_REPOSITORY)
    private readonly units: UnitRepository,
  ) {}

  async execute(rawUnitId: string, command: UpdateUnitCommand): Promise<Unit> {
    const id = UnitId.of(rawUnitId);

    const unit = await this.units.findById(id);
    if (!unit) {
      throw new UnitNotFoundError(id.value);
    }

    if (command.unitDescription !== undefined) {
      unit.changeDescription(UnitDescription.of(command.unitDescription));
    }

    if (command.unitActive !== undefined) {
      if (command.unitActive) {
        unit.activate();
      } else {
        unit.deactivate();
      }
    }

    await this.units.update(unit);
    return unit;
  }
}
