import { Inject, Injectable } from '@nestjs/common';
import { Department } from '../domain/department';
import { UBIGEO_REPOSITORY } from '../domain/ubigeo.repository';
import type { UbigeoRepository } from '../domain/ubigeo.repository';

@Injectable()
export class ListDepartmentsUseCase {
  constructor(
    @Inject(UBIGEO_REPOSITORY)
    private readonly ubigeo: UbigeoRepository,
  ) {}

  execute(): Promise<Department[]> {
    return this.ubigeo.findAllDepartments();
  }
}
