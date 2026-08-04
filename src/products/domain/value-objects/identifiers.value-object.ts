import { UuidValueObject } from '../../../shared/domain/uuid.value-object';

export class ProductId extends UuidValueObject {
  static of(valor: string): ProductId {
    return new ProductId(this.ensureValid('El id de producto', valor));
  }
}

/**
 * BrandId y CategoryId se reexportan desde sus modulos, que son los duenos de
 * esas identidades. Productos las referencia; definir aqui una copia haria que
 * dos clases distintas representaran lo mismo y `instanceof` fallaria entre
 * modulos.
 */
export { BrandId } from '../../../brands/domain/value-objects/brand-id.value-object';
export { CategoryId } from '../../../categories/domain/value-objects/category-id.value-object';
