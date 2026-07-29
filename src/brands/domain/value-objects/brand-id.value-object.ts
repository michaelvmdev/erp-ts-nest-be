import { UuidValueObject } from '../../../shared/domain/uuid.value-object';

/**
 * Identidad del agregado Marca.
 *
 * Vive en este modulo y no en products porque Marca es la duena de su propia
 * identidad. El modulo de productos la importa para referenciarla, que es la
 * direccion correcta de la dependencia.
 */
export class BrandId extends UuidValueObject {
  static of(valor: string): BrandId {
    return new BrandId(this.ensureValid('El id de marca', valor));
  }
}
