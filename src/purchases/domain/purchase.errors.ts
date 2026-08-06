import { ConflictError, NotFoundError } from '../../shared/domain/domain.error';

export class PurchaseNotFoundError extends NotFoundError {
  readonly code = 'PURCHASE_NOT_FOUND';

  constructor(purchaseId: string) {
    super(`No existe una compra con id ${purchaseId}.`);
  }
}

export class PurchaseSupplierNotFoundError extends NotFoundError {
  readonly code = 'SUPPLIER_NOT_FOUND';

  constructor(supplierId: string) {
    super(`No existe un proveedor con id ${supplierId}.`);
  }
}

export class PurchaseProductsNotFoundError extends NotFoundError {
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
 * El proveedor esta inactivo.
 *
 * Se responde 409 y no 400: los datos son correctos, pero el estado del sistema
 * impide la operacion. Un proveedor inactivo conserva su historial de compras;
 * lo que no admite es una compra nueva.
 *
 * Nota: los productos inactivos SI se pueden comprar (reabastecer un producto
 * temporalmente fuera de venta es legitimo), asi que no hay un error analogo
 * para ellos: solo se valida que existan.
 */
export class InactivePurchaseSupplierError extends ConflictError {
  readonly code = 'SUPPLIER_INACTIVE';

  constructor(supplierId: string) {
    super(
      `El proveedor ${supplierId} esta inactivo y no admite compras nuevas.`,
    );
  }
}
