import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Product } from '../domain/product';
import { BrandNotFoundError } from '../domain/product.errors';
import {
  BRAND_EXISTENCE_CHECKER,
  PRODUCT_REPOSITORY,
} from '../domain/product.repository';
import type {
  BrandExistenceChecker,
  ProductRepository,
} from '../domain/product.repository';
import {
  BrandId,
  ProductId,
} from '../domain/value-objects/identifiers.value-object';
import { Money } from '../domain/value-objects/money.value-object';
import {
  ProductDescription,
  ProductImage,
  ProductName,
} from '../domain/value-objects/product-text.value-object';
import { CreateProductCommand } from './product.commands';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepository,
    @Inject(BRAND_EXISTENCE_CHECKER)
    private readonly brands: BrandExistenceChecker,
  ) {}

  async execute(command: CreateProductCommand): Promise<Product> {
    const brandId = BrandId.of(command.brandId);

    // Se comprueba antes de insertar para poder devolver 404 con un mensaje que
    // nombre la marca. Sin esto, la clave foranea daria un 500 ilegible.
    if (!(await this.brands.exists(brandId))) {
      throw new BrandNotFoundError(brandId.value);
    }

    // El id lo genera el backend, como fija el comentario de db/db.sql.
    const product = Product.create({
      id: ProductId.of(randomUUID()),
      brandId,
      name: ProductName.of(command.productName),
      description: ProductDescription.of(command.productDescription),
      image: ProductImage.of(command.productImage),
      unitPrice: Money.fromNumber(command.productUnitPrice),
      active: command.productActive,
    });

    await this.products.insert(product);
    return product;
  }
}
