import { Product } from '../../domain/product';
import {
  BrandId,
  CategoryId,
  ProductId,
} from '../../domain/value-objects/identifiers.value-object';
import { Money } from '../../domain/value-objects/money.value-object';
import {
  ProductDescription,
  ProductImage,
  ProductName,
} from '../../domain/value-objects/product-text.value-object';
import { ProductOrmEntity } from './product.orm-entity';

/**
 * Frontera entre persistencia y dominio.
 *
 * Concentrar la traduccion en un unico punto evita que los value objects se
 * filtren hacia TypeORM o que las filas crudas se cuelen en los casos de uso.
 */
export class ProductMapper {
  static toDomain(row: ProductOrmEntity): Product {
    return Product.rehydrate({
      id: ProductId.of(row.productId),
      brandId: BrandId.of(row.brandId),
      categoryId: CategoryId.of(row.categoryId),
      name: ProductName.of(row.productName),
      description: ProductDescription.of(row.productDescription),
      image: ProductImage.of(row.productImage),
      // fromDecimalString y no fromNumber: la fila trae "4899.00" como texto.
      unitPrice: Money.fromDecimalString(row.productUnitPrice),
      active: row.productActive,
    });
  }

  static toPersistence(product: Product): ProductOrmEntity {
    const snapshot = product.toSnapshot();

    const row = new ProductOrmEntity();
    row.productId = snapshot.id;
    row.brandId = snapshot.brandId;
    row.categoryId = snapshot.categoryId;
    row.productName = snapshot.name;
    row.productDescription = snapshot.description;
    row.productImage = snapshot.image;
    row.productUnitPrice = snapshot.unitPrice.toDecimalString();
    row.productActive = snapshot.active;
    return row;
  }
}
