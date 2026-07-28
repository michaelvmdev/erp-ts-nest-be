import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../domain/product';
import { ProductNotFoundError } from '../domain/product.errors';
import { PRODUCT_REPOSITORY } from '../domain/product.repository';
import type { ProductRepository } from '../domain/product.repository';
import { ProductId } from '../domain/value-objects/identifiers.value-object';

@Injectable()
export class FindProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepository,
  ) {}

  async execute(rawProductId: string): Promise<Product> {
    // Construir el value object valida el formato: un id que no es UUID falla
    // aca con 400, sin llegar a consultar la base.
    const id = ProductId.of(rawProductId);

    const product = await this.products.findById(id);
    if (!product) {
      throw new ProductNotFoundError(id.value);
    }
    return product;
  }
}
