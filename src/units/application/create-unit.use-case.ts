import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Unit } from '../domain/unit';
import { UnitCodeAlreadyExistsError } from '../domain/unit.errors';
import { UNIT_REPOSITORY } from '../domain/unit.repository';
import type { UnitRepository } from '../domain/unit.repository';
import { UnitCode } from '../domain/value-objects/unit-code.value-object';
import { UnitDescription } from '../domain/value-objects/unit-description.value-object';
import { UnitId } from '../domain/value-objects/unit-id.value-object';
import { CreateUnitCommand } from './unit.commands';

@Injectable()
export class CreateUnitUseCase {
  constructor(
    @Inject(UNIT_REPOSITORY)
    private readonly units: UnitRepository,
  ) {}

  async execute(command: CreateUnitCommand): Promise<Unit> {
    const code = UnitCode.of(command.unitCode);
    const description = UnitDescription.of(command.unitDescription);

    const existente = await this.units.findByCode(code);
    if (existente) {
      throw new UnitCodeAlreadyExistsError(code.value);
    }

    const unit = Unit.create({
      id: UnitId.of(randomUUID()),
      code,
      description,
      active: command.unitActive,
    });

    await this.units.insert(unit);
    return unit;
  }
}
