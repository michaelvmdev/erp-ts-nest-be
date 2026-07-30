import { Inject, Injectable } from '@nestjs/common';
import { District } from '../domain/district';
import { ProvinceNotFoundError } from '../domain/ubigeo.errors';
import { UBIGEO_REPOSITORY } from '../domain/ubigeo.repository';
import type { UbigeoRepository } from '../domain/ubigeo.repository';
import { ProvinceId } from '../domain/value-objects/province-id.value-object';

@Injectable()
export class ListDistrictsUseCase {
  constructor(
    @Inject(UBIGEO_REPOSITORY)
    private readonly ubigeo: UbigeoRepository,
  ) {}

  async execute(provinceId: string): Promise<District[]> {
    const id = ProvinceId.of(provinceId);

    if (!(await this.ubigeo.provinceExists(id))) {
      throw new ProvinceNotFoundError(id.value);
    }

    return this.ubigeo.findDistrictsByProvince(id);
  }
}
