import { Inject, Injectable } from '@nestjs/common';
import { ProductNotFoundError } from '../domain/product.errors';
import { PRODUCT_REPOSITORY } from '../domain/product.repository';
import type { ProductRepository } from '../domain/product.repository';
import { ProductId } from '../domain/value-objects/identifiers.value-object';

@Injectable()
export class DeleteProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepository,
  ) {}

  async execute(rawProductId: string): Promise<void> {
    const id = ProductId.of(rawProductId);

    // Se consulta antes de borrar para distinguir 404 ("no existe") de 204
    // ("existia y se borro"). Sin esta lectura, un DELETE sobre un id inexistente
    // devolveria 204 y el cliente creeria que borro algo.
    const product = await this.products.findById(id);
    if (!product) {
      throw new ProductNotFoundError(id.value);
    }

    // Si el producto figura en ventas, el adaptador traduce la violacion de
    // clave foranea a ProductInUseError y el filtro responde 409.
    await this.products.delete(id);
  }
}
