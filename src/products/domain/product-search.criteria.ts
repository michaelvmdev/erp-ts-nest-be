import { InvalidInputError } from '../../shared/domain/domain.error';
import { PageRequest } from '../../shared/domain/pagination';
import { Money } from './value-objects/money.value-object';
import { BrandId } from './value-objects/identifiers.value-object';

export class InvalidPriceRangeError extends InvalidInputError {
  readonly code = 'INVALID_PRICE_RANGE';

  constructor(message: string) {
    super(message);
  }
}

/** Rango de precio cerrado por cualquiera de sus dos extremos, o por ambos. */
export class PriceRange {
  private constructor(
    readonly min: Money | null,
    readonly max: Money | null,
  ) {}

  static of(min?: Money | null, max?: Money | null): PriceRange {
    const desde = min ?? null;
    const hasta = max ?? null;
    if (desde && hasta && desde.centimos > hasta.centimos) {
      throw new InvalidPriceRangeError(
        `El precio minimo (${desde.toDecimalString()}) no puede superar al maximo (${hasta.toDecimalString()}).`,
      );
    }
    return new PriceRange(desde, hasta);
  }

  get isEmpty(): boolean {
    return this.min === null && this.max === null;
  }
}

export type ProductSortField = 'name' | 'unitPrice';
export type SortDirection = 'ASC' | 'DESC';

/**
 * Criterio de busqueda de productos.
 *
 * Expresa *que* se busca en lenguaje de dominio. No sabe nada de SQL ni de
 * TypeORM: traducirlo a una consulta es responsabilidad del adaptador de
 * persistencia. Cambiar de PostgreSQL a otro motor no toca esta clase.
 */
export class ProductSearchCriteria {
  private constructor(
    readonly description: string | null,
    readonly priceRange: PriceRange,
    readonly brandId: BrandId | null,
    readonly active: boolean | null,
    readonly sortBy: ProductSortField,
    readonly sortDirection: SortDirection,
    readonly page: PageRequest,
  ) {}

  static of(params: {
    description?: string | null;
    priceRange?: PriceRange;
    brandId?: BrandId | null;
    active?: boolean | null;
    sortBy?: ProductSortField;
    sortDirection?: SortDirection;
    page: PageRequest;
  }): ProductSearchCriteria {
    const descripcion = params.description?.trim();
    return new ProductSearchCriteria(
      descripcion ? descripcion : null,
      params.priceRange ?? PriceRange.of(),
      params.brandId ?? null,
      params.active ?? null,
      params.sortBy ?? 'name',
      params.sortDirection ?? 'ASC',
      params.page,
    );
  }
}
