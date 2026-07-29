import { ConflictError, NotFoundError } from '../../shared/domain/domain.error';

export class BrandNotFoundError extends NotFoundError {
  readonly code = 'BRAND_NOT_FOUND';

  constructor(brandId: string) {
    super(`No existe una marca con id ${brandId}.`);
  }
}

/**
 * Ya hay una marca con esa descripcion.
 *
 * La comparacion ignora mayusculas y espacios de los extremos: "Apple",
 * "apple" y " Apple " son la misma marca, y permitir las tres duplicaria el
 * catalogo con entradas que un humano lee como identicas.
 */
export class BrandAlreadyExistsError extends ConflictError {
  readonly code = 'BRAND_ALREADY_EXISTS';

  constructor(description: string) {
    super(`Ya existe una marca con la descripcion "${description}".`);
  }
}
