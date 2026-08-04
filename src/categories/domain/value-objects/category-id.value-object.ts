import { UuidValueObject } from '../../../shared/domain/uuid.value-object';

/**
 * Identidad del agregado Categoria.
 *
 * Vive en este modulo y no en products porque Categoria es la duena de su
 * propia identidad. El modulo de productos la importa para referenciarla, que
 * es la direccion correcta de la dependencia.
 */
export class CategoryId extends UuidValueObject {
  static of(valor: string): CategoryId {
    return new CategoryId(this.ensureValid('El id de categoria', valor));
  }
}
