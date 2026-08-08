import { Inject, Injectable } from '@nestjs/common';
import { Page } from '../../shared/domain/pagination';
import { Unit } from '../domain/unit';
import { UnitSearchCriteria } from '../domain/unit-search.criteria';
import { UNIT_REPOSITORY } from '../domain/unit.repository';
import type { UnitRepository } from '../domain/unit.repository';
import { ListUnitsQuery } from './unit.commands';

@Injectable()
export class ListUnitsUseCase {
  constructor(
    @Inject(UNIT_REPOSITORY)
    private readonly units: UnitRepository,
  ) {}

  async execute(query: ListUnitsQuery): Promise<Page<Unit>> {
    const criteria = UnitSearchCriteria.of({
      code: query.unitCode,
      description: query.unitDescription,
      active: query.unitActive ?? null,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return this.units.search(criteria);
  }
}
