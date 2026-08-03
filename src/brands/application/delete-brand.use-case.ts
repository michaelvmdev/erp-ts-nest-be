import { Inject, Injectable } from '@nestjs/common';
import { BrandNotFoundError } from '../domain/brand.errors';
import { BRAND_REPOSITORY } from '../domain/brand.repository';
import type { BrandRepository } from '../domain/brand.repository';
import { BrandId } from '../domain/value-objects/brand-id.value-object';

@Injectable()
export class DeleteBrandUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY)
    private readonly brands: BrandRepository,
  ) {}

  async execute(rawBrandId: string): Promise<void> {
    const id = BrandId.of(rawBrandId);

    // Se consulta antes de borrar para distinguir 404 ("no existe") de 204
    // ("existia y se borro"). Sin esta lectura, un DELETE sobre un id inexistente
    // devolveria 204 y el cliente creeria que borro algo.
    const brand = await this.brands.findById(id);
    if (!brand) {
      throw new BrandNotFoundError(id.value);
    }

    // Si la marca tiene productos, el adaptador traduce la violacion de clave
    // foranea a BrandInUseError y el filtro responde 409.
    await this.brands.delete(id);
  }
}
