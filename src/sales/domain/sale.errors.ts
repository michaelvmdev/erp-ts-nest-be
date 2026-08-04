import { ConflictError, NotFoundError } from '../../shared/domain/domain.error';

export class SaleNotFoundError extends NotFoundError {
  readonly code = 'SALE_NOT_FOUND';

  constructor(saleId: string) {
    super(`No existe una venta con id ${saleId}.`);
  }
}

export class SaleTypeNotFoundError extends NotFoundError {
  readonly code = 'SALE_TYPE_NOT_FOUND';

  constructor(saleTypeId: number) {
    super(`No existe un tipo de comprobante con id ${saleTypeId}.`);
  }
}

export class SaleClientNotFoundError extends NotFoundError {
  readonly code = 'CLIENT_NOT_FOUND';

  constructor(clientId: string) {
    super(`No existe un cliente con id ${clientId}.`);
  }
}

export class SaleDistrictNotFoundError extends NotFoundError {
  readonly code = 'DISTRICT_NOT_FOUND';

  constructor(districtId: string) {
    super(`No existe un distrito con codigo ${districtId}.`);
  }
}

export class SaleProductsNotFoundError extends NotFoundError {
  readonly code = 'PRODUCT_NOT_FOUND';

  constructor(productIds: readonly string[]) {
    super(
      productIds.length === 1
        ? `No existe un producto con id ${productIds[0]}.`
        : `No existen los productos: ${productIds.join(', ')}.`,
    );
  }
}

/**
 * El cliente esta inactivo.
 *
 * Se responde 409 y no 400: los datos son correctos, pero el estado del sistema
 * impide la operacion. Un cliente inactivo conserva su historial de compras; lo
 * que no admite es una venta nueva.
 */
export class InactiveClientError extends ConflictError {
  readonly code = 'CLIENT_INACTIVE';

  constructor(clientId: string) {
    super(`El cliente ${clientId} esta inactivo y no admite ventas nuevas.`);
  }
}

/** Alguno de los productos esta inactivo y no se puede vender. */
export class InactiveProductsError extends ConflictError {
  readonly code = 'PRODUCT_INACTIVE';

  constructor(productIds: readonly string[]) {
    super(
      productIds.length === 1
        ? `El producto ${productIds[0]} esta inactivo y no se puede vender.`
        : `Estos productos estan inactivos y no se pueden vender: ${productIds.join(', ')}.`,
    );
  }
}

/**
 * La serie del tipo de comprobante agoto sus diez digitos.
 *
 * En la practica no va a pasar —son diez mil millones de documentos— pero es un
 * limite real del formato y callarlo dejaria un fallo incomprensible el dia que
 * el correlativo desbordara.
 */
export class SaleSeriesExhaustedError extends ConflictError {
  readonly code = 'SALE_SERIES_EXHAUSTED';

  constructor(code: string) {
    super(`La serie ${code} agoto su correlativo de 10 digitos.`);
  }
}
