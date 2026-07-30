import { Inject, Injectable } from '@nestjs/common';
import { Province } from '../domain/province';
import { DepartmentNotFoundError } from '../domain/ubigeo.errors';
import { UBIGEO_REPOSITORY } from '../domain/ubigeo.repository';
import type { UbigeoRepository } from '../domain/ubigeo.repository';
import { DepartmentId } from '../domain/value-objects/department-id.value-object';

@Injectable()
export class ListProvincesUseCase {
  constructor(
    @Inject(UBIGEO_REPOSITORY)
    private readonly ubigeo: UbigeoRepository,
  ) {}

  async execute(departmentId: string): Promise<Province[]> {
    // El VO valida el formato: un codigo mal formado corta aca con 400 antes
    // de tocar la base.
    const id = DepartmentId.of(departmentId);

    if (!(await this.ubigeo.departmentExists(id))) {
      throw new DepartmentNotFoundError(id.value);
    }

    return this.ubigeo.findProvincesByDepartment(id);
  }
}
