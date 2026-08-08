import { ConflictError, NotFoundError } from '../../shared/domain/domain.error';

export class PriceListNotFoundError extends NotFoundError {
  readonly code = 'PRICE_LIST_NOT_FOUND';

  constructor(priceListId: string) {
    super(`No existe una lista de precio con id ${priceListId}.`);
  }
}

export class PriceListNameAlreadyExistsError extends ConflictError {
  readonly code = 'PRICE_LIST_NAME_ALREADY_EXISTS';

  constructor(name: string) {
    super(`Ya existe una lista de precio con el nombre "${name}".`);
  }
}

export class PriceListItemNotFoundError extends NotFoundError {
  readonly code = 'PRICE_LIST_ITEM_NOT_FOUND';

  constructor(productId: string) {
    super(`El producto ${productId} no esta en esta lista de precio.`);
  }
}

export class ProductNotInCatalogError extends ConflictError {
  readonly code = 'PRODUCT_NOT_IN_CATALOG';

  constructor(productId: string) {
    super(`El producto ${productId} no existe en el catalogo.`);
  }
}
