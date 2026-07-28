import { ConflictError, NotFoundError } from '../../shared/domain/domain.error';

export class ProductNotFoundError extends NotFoundError {
  readonly code = 'PRODUCT_NOT_FOUND';

  constructor(productId: string) {
    super(`No existe un producto con id ${productId}.`);
  }
}

export class BrandNotFoundError extends NotFoundError {
  readonly code = 'BRAND_NOT_FOUND';

  constructor(brandId: string) {
    super(`No existe una marca con id ${brandId}.`);
  }
}

/**
 * El producto figura en ventas ya registradas.
 *
 * Se responde 409 y no 500: la peticion es valida, pero choca con el estado del
 * sistema. Borrarlo dejaria huerfanas las lineas de venta que lo referencian, y
 * la clave foranea de sale_details lo impide. La salida correcta es desactivarlo.
 */
export class ProductInUseError extends ConflictError {
  readonly code = 'PRODUCT_IN_USE';

  constructor(productId: string) {
    super(
      `El producto ${productId} no se puede eliminar porque aparece en ventas registradas. ` +
        'Desactivalo con PATCH /products/{productId} enviando "productActive": false.',
    );
  }
}
