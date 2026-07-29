import { Inject, Injectable } from '@nestjs/common';
import { Brand } from '../domain/brand';
import { BrandNotFoundError } from '../domain/brand.errors';
import { BRAND_REPOSITORY } from '../domain/brand.repository';
import type { BrandRepository } from '../domain/brand.repository';
import { BrandId } from '../domain/value-objects/brand-id.value-object';

@Injectable()
export class FindBrandUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY)
    private readonly brands: BrandRepository,
  ) {}

  async execute(rawBrandId: string): Promise<Brand> {
    const id = BrandId.of(rawBrandId);

    const brand = await this.brands.findById(id);
    if (!brand) {
      throw new BrandNotFoundError(id.value);
    }
    return brand;
  }
}
