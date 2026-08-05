import { UuidValueObject } from '../../../shared/domain/uuid.value-object';

/**
 * Identidad del agregado Proveedor.
 *
 * Vive en este modulo porque Proveedor es el dueno de su propia identidad. El
 * modulo de compras la importa para referenciarla, que es la direccion
 * correcta de la dependencia.
 */
export class SupplierId extends UuidValueObject {
  static of(valor: string): SupplierId {
    return new SupplierId(this.ensureValid('El id de proveedor', valor));
  }
}
