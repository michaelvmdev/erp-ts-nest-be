import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../domain/product';
import {
  BrandNotFoundError,
  CategoryNotFoundError,
  ProductNotFoundError,
} from '../domain/product.errors';
import {
  BRAND_EXISTENCE_CHECKER,
  CATEGORY_EXISTENCE_CHECKER,
  PRODUCT_REPOSITORY,
} from '../domain/product.repository';
import type {
  BrandExistenceChecker,
  CategoryExistenceChecker,
  ProductRepository,
} from '../domain/product.repository';
import {
  BrandId,
  CategoryId,
  ProductId,
} from '../domain/value-objects/identifiers.value-object';
import { Money } from '../domain/value-objects/money.value-object';
import {
  ProductDescription,
  ProductImage,
  ProductName,
} from '../domain/value-objects/product-text.value-object';
import { UpdateProductCommand } from './product.commands';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepository,
    @Inject(BRAND_EXISTENCE_CHECKER)
    private readonly brands: BrandExistenceChecker,
    @Inject(CATEGORY_EXISTENCE_CHECKER)
    private readonly categories: CategoryExistenceChecker,
  ) {}

  async execute(
    rawProductId: string,
    command: UpdateProductCommand,
  ): Promise<Product> {
    const id = ProductId.of(rawProductId);

    const product = await this.products.findById(id);
    if (!product) {
      throw new ProductNotFoundError(id.value);
    }

    // Semantica PATCH: solo se toca lo que vino en el cuerpo. Se compara contra
    // `undefined` y no con un chequeo de veracidad, porque `null`, `false` y `0`
    // son valores legitimos que hay que aplicar.
    if (command.brandId !== undefined) {
      const brandId = BrandId.of(command.brandId);
      if (!(await this.brands.exists(brandId))) {
        throw new BrandNotFoundError(brandId.value);
      }
      product.reassignBrand(brandId);
    }

    if (command.categoryId !== undefined) {
      const categoryId = CategoryId.of(command.categoryId);
      if (!(await this.categories.exists(categoryId))) {
        throw new CategoryNotFoundError(categoryId.value);
      }
      product.reassignCategory(categoryId);
    }

    if (command.productName !== undefined) {
      product.rename(ProductName.of(command.productName));
    }

    if (command.productDescription !== undefined) {
      product.describeAs(ProductDescription.of(command.productDescription));
    }

    if (command.productImage !== undefined) {
      product.changeImage(ProductImage.of(command.productImage));
    }

    if (command.productUnitPrice !== undefined) {
      product.reprice(Money.fromNumber(command.productUnitPrice));
    }

    if (command.productActive !== undefined) {
      if (command.productActive) {
        product.activate();
      } else {
        product.deactivate();
      }
    }

    await this.products.update(product);
    return product;
  }
}
