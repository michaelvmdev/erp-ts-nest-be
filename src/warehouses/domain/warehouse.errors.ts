import { ConflictError, NotFoundError } from '../../shared/domain/domain.error';

export class WarehouseNotFoundError extends NotFoundError {
  readonly code = 'WAREHOUSE_NOT_FOUND';

  constructor(warehouseId: string) {
    super(`No existe un almacen con id ${warehouseId}.`);
  }
}

export class WarehouseCodeAlreadyExistsError extends ConflictError {
  readonly code = 'WAREHOUSE_CODE_ALREADY_EXISTS';

  constructor(code: string) {
    super(`Ya existe un almacen con el codigo "${code}".`);
  }
}
