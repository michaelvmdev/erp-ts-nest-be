import { InvalidInputError } from './domain.error';

export class InvalidPaginationError extends InvalidInputError {
  readonly code = 'INVALID_PAGINATION';

  constructor(message: string) {
    super(message);
  }
}

/**
 * Peticion de pagina. Es un value object: se valida al construirse, de modo que
 * ninguna capa de mas abajo tiene que volver a preguntarse si `limit` es sano.
 */
export class PageRequest {
  static readonly DEFAULT_PAGE = 1;
  static readonly DEFAULT_LIMIT = 20;
  static readonly MAX_LIMIT = 100;

  private constructor(
    readonly page: number,
    readonly limit: number,
  ) {}

  static of(page?: number, limit?: number): PageRequest {
    const p = page ?? PageRequest.DEFAULT_PAGE;
    const l = limit ?? PageRequest.DEFAULT_LIMIT;

    if (!Number.isInteger(p) || p < 1) {
      throw new InvalidPaginationError(
        `La pagina debe ser un entero mayor o igual a 1, se recibio ${p}.`,
      );
    }
    if (!Number.isInteger(l) || l < 1) {
      throw new InvalidPaginationError(
        `El limite debe ser un entero mayor o igual a 1, se recibio ${l}.`,
      );
    }
    // Un tope duro evita que un cliente pida un millon de filas y tumbe el proceso.
    if (l > PageRequest.MAX_LIMIT) {
      throw new InvalidPaginationError(
        `El limite no puede superar ${PageRequest.MAX_LIMIT}, se recibio ${l}.`,
      );
    }

    return new PageRequest(p, l);
  }

  get offset(): number {
    return (this.page - 1) * this.limit;
  }
}

/** Resultado paginado. Inmutable y agnostico del transporte. */
export class Page<T> {
  readonly totalPages: number;

  constructor(
    readonly items: readonly T[],
    readonly total: number,
    readonly page: number,
    readonly limit: number,
  ) {
    this.totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  }

  map<U>(fn: (item: T) => U): Page<U> {
    return new Page<U>(this.items.map(fn), this.total, this.page, this.limit);
  }
}
