import { Inject, Injectable } from '@nestjs/common';
import { Brand } from '../domain/brand';
import {
  BrandAlreadyExistsError,
  BrandNotFoundError,
} from '../domain/brand.errors';
import { BRAND_REPOSITORY } from '../domain/brand.repository';
import type { BrandRepository } from '../domain/brand.repository';
import { BrandDescription } from '../domain/value-objects/brand-description.value-object';
import { BrandId } from '../domain/value-objects/brand-id.value-object';
import { UpdateBrandCommand } from './brand.commands';

@Injectable()
export class UpdateBrandUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY)
    private readonly brands: BrandRepository,
  ) {}

  async execute(
    rawBrandId: string,
    command: UpdateBrandCommand,
  ): Promise<Brand> {
    const id = BrandId.of(rawBrandId);

    const brand = await this.brands.findById(id);
    if (!brand) {
      throw new BrandNotFoundError(id.value);
    }

    // Semantica PATCH: se compara contra `undefined`, no por veracidad, para que
    // `false` se aplique como el valor legitimo que es. Justamente el caso de
    // desactivar la marca.
    if (command.brandDescription !== undefined) {
      const description = BrandDescription.of(command.brandDescription);

      // Se excluye la propia marca de la busqueda: renombrar "Apple" a "apple"
      // no debe chocar consigo misma.
      const otra = await this.brands.findByDescription(description, id);
      if (otra) {
        throw new BrandAlreadyExistsError(description.value);
      }
      brand.rename(description);
    }

    if (command.brandActive !== undefined) {
      if (command.brandActive) {
        brand.activate();
      } else {
        brand.deactivate();
      }
    }

    await this.brands.update(brand);
    return brand;
  }
}
