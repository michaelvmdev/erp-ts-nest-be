import { ConflictError, NotFoundError } from '../../shared/domain/domain.error';

export class CategoryNotFoundError extends NotFoundError {
  readonly code = 'CATEGORY_NOT_FOUND';

  constructor(categoryId: string) {
    super(`No existe una categoria con id ${categoryId}.`);
  }
}

/**
 * Ya hay una categoria con esa descripcion.
 *
 * La comparacion ignora mayusculas y espacios de los extremos: "Audio",
 * "audio" y " Audio " son la misma categoria, y permitir las tres duplicaria el
 * catalogo con entradas que un humano lee como identicas.
 */
export class CategoryAlreadyExistsError extends ConflictError {
  readonly code = 'CATEGORY_ALREADY_EXISTS';

  constructor(description: string) {
    super(`Ya existe una categoria con la descripcion "${description}".`);
  }
}

/**
 * La categoria tiene productos que la referencian.
 *
 * Se responde 409 y no 500: la peticion es valida, pero choca con el estado del
 * sistema. Borrarla dejaria huerfanos esos productos y la clave foranea de
 * products lo impide. La salida correcta es desactivarla.
 */
export class CategoryInUseError extends ConflictError {
  readonly code = 'CATEGORY_IN_USE';

  constructor(categoryId: string) {
    super(
      `La categoria ${categoryId} no se puede eliminar porque tiene productos asociados. ` +
        'Desactivala con PATCH /categories/{categoryId} enviando "categoryActive": false.',
    );
  }
}
