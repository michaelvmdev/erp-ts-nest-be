import { Inject, Injectable } from '@nestjs/common';
import { Unit } from '../domain/unit';
import { UnitNotFoundError } from '../domain/unit.errors';
import { UNIT_REPOSITORY } from '../domain/unit.repository';
import type { UnitRepository } from '../domain/unit.repository';
import { UnitId } from '../domain/value-objects/unit-id.value-object';

@Injectable()
export class FindUnitUseCase {
  constructor(
    @Inject(UNIT_REPOSITORY)
    private readonly units: UnitRepository,
  ) {}

  async execute(rawUnitId: string): Promise<Unit> {
    const id = UnitId.of(rawUnitId);
    const unit = await this.units.findById(id);
    if (!unit) {
      throw new UnitNotFoundError(id.value);
    }
    return unit;
  }
}
