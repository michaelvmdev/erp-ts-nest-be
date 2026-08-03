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

/**
 * La marca tiene productos que la referencian.
 *
 * Se responde 409 y no 500: la peticion es valida, pero choca con el estado del
 * sistema. Borrarla dejaria huerfanos esos productos, y la clave foranea de
 * products lo impide. La salida correcta es desactivarla.
 */
export class BrandInUseError extends ConflictError {
  readonly code = 'BRAND_IN_USE';

  constructor(brandId: string) {
    super(
      `La marca ${brandId} no se puede eliminar porque tiene productos asociados. ` +
        'Desactivala con PATCH /brands/{brandId} enviando "brandActive": false.',
    );
  }
}
