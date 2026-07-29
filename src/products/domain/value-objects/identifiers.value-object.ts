import { UuidValueObject } from '../../../shared/domain/uuid.value-object';

export class ProductId extends UuidValueObject {
  static of(valor: string): ProductId {
    return new ProductId(this.ensureValid('El id de producto', valor));
  }
}

/**
 * BrandId se reexporta desde el modulo de marcas, que es el dueno de esa
 * identidad. Productos la referencia; definir aqui una copia haria que dos
 * clases distintas representaran lo mismo y `instanceof` fallaria entre modulos.
 */
export { BrandId } from '../../../brands/domain/value-objects/brand-id.value-object';
