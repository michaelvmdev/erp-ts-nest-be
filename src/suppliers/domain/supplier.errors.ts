import { ConflictError, NotFoundError } from '../../shared/domain/domain.error';

export class SupplierNotFoundError extends NotFoundError {
  readonly code = 'SUPPLIER_NOT_FOUND';

  constructor(supplierId: string) {
    super(`No existe un proveedor con id ${supplierId}.`);
  }
}

/** Ya hay un proveedor registrado con ese RUC. */
export class SupplierRucAlreadyExistsError extends ConflictError {
  readonly code = 'SUPPLIER_RUC_ALREADY_EXISTS';

  constructor(ruc: string) {
    super(`Ya existe un proveedor registrado con el RUC ${ruc}.`);
  }
}

/**
 * El proveedor figura en compras ya registradas.
 *
 * Se responde 409 y no 500: la peticion es valida, pero choca con el estado del
 * sistema. Borrarlo dejaria huerfano el historico de compras que lo
 * referencia, y la clave foranea de purchases lo impide. La salida correcta es
 * desactivarlo.
 */
export class SupplierInUseError extends ConflictError {
  readonly code = 'SUPPLIER_IN_USE';

  constructor(supplierId: string) {
    super(
      `El proveedor ${supplierId} no se puede eliminar porque figura en compras registradas. ` +
        'Desactivalo con PATCH /suppliers/{supplierId} enviando "supplierActive": false.',
    );
  }
}
