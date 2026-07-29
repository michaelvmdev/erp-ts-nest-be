import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Brand } from '../domain/brand';
import { BrandAlreadyExistsError } from '../domain/brand.errors';
import { BRAND_REPOSITORY } from '../domain/brand.repository';
import type { BrandRepository } from '../domain/brand.repository';
import { BrandDescription } from '../domain/value-objects/brand-description.value-object';
import { BrandId } from '../domain/value-objects/brand-id.value-object';
import { CreateBrandCommand } from './brand.commands';

@Injectable()
export class CreateBrandUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY)
    private readonly brands: BrandRepository,
  ) {}

  async execute(command: CreateBrandCommand): Promise<Brand> {
    const description = BrandDescription.of(command.brandDescription);

    // Sin esta comprobacion, el catalogo terminaria con "Apple", "apple" y
    // " Apple " como tres marcas distintas.
    const existente = await this.brands.findByDescription(description);
    if (existente) {
      throw new BrandAlreadyExistsError(description.value);
    }

    // El id lo genera el backend, igual que en productos.
    const brand = Brand.create({
      id: BrandId.of(randomUUID()),
      description,
      active: command.brandActive,
    });

    await this.brands.insert(brand);
    return brand;
  }
}
