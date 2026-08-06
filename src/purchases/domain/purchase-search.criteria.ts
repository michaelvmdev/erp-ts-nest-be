import { InvalidInputError } from '../../shared/domain/domain.error';
import { Money } from '../../shared/domain/money.value-object';
import { PageRequest } from '../../shared/domain/pagination';
import { SupplierId } from '../../suppliers/domain/value-objects/supplier-id.value-object';

export class InvalidPurchaseFilterError extends InvalidInputError {
  readonly code = 'INVALID_PURCHASE_FILTER';

  constructor(message: string) {
    super(message);
  }
}

/** Rango de fechas cerrado por cualquiera de sus dos extremos, o por ambos. */
export class DateRange {
  private constructor(
    readonly from: string | null,
    readonly to: string | null,
  ) {}

  static of(from?: string | null, to?: string | null): DateRange {
    const desde = DateRange.normalizar(from, 'dateFrom');
    const hasta = DateRange.normalizar(to, 'dateTo');
    if (desde && hasta && desde > hasta) {
      throw new InvalidPurchaseFilterError(
        `dateFrom (${desde}) no puede ser posterior a dateTo (${hasta}).`,
      );
    }
    return new DateRange(desde, hasta);
  }

  private static normalizar(
    valor: string | null | undefined,
    campo: string,
  ): string | null {
    if (valor === null || valor === undefined || valor.trim() === '')
      return null;
    const limpio = valor.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(limpio)) {
      throw new InvalidPurchaseFilterError(
        `${campo} debe tener el formato YYYY-MM-DD, se recibio "${valor}".`,
      );
    }
    return limpio;
  }

  get isEmpty(): boolean {
    return this.from === null && this.to === null;
  }
}

export class TotalRange {
  private constructor(
    readonly min: Money | null,
    readonly max: Money | null,
  ) {}

  static of(min?: Money | null, max?: Money | null): TotalRange {
    const desde = min ?? null;
    const hasta = max ?? null;
    if (desde && hasta && desde.centimos > hasta.centimos) {
      throw new InvalidPurchaseFilterError(
        `El total minimo (${desde.toDecimalString()}) no puede superar al maximo (${hasta.toDecimalString()}).`,
      );
    }
    return new TotalRange(desde, hasta);
  }
}

export type PurchaseSortField = 'date' | 'total';
export type SortDirection = 'ASC' | 'DESC';

/**
 * Criterio de listado de compras.
 *
 * Mas acotado que el de ventas: la compra no tiene numero de comprobante ni
 * ubigeo, asi que solo se filtra por proveedor, rango de fechas y rango de
 * total.
 */
export class PurchaseSearchCriteria {
  private constructor(
    readonly supplierId: SupplierId | null,
    readonly dates: DateRange,
    readonly totals: TotalRange,
    readonly sortBy: PurchaseSortField,
    readonly sortDirection: SortDirection,
    readonly page: PageRequest,
  ) {}

  static of(params: {
    supplierId?: SupplierId | null;
    dates?: DateRange;
    totals?: TotalRange;
    sortBy?: PurchaseSortField;
    sortDirection?: SortDirection;
    page?: number;
    limit?: number;
  }): PurchaseSearchCriteria {
    return new PurchaseSearchCriteria(
      params.supplierId ?? null,
      params.dates ?? DateRange.of(),
      params.totals ?? TotalRange.of(),
      // Por fecha descendente: lo habitual al listar compras es querer las
      // ultimas, no las de hace anos.
      params.sortBy ?? 'date',
      params.sortDirection ?? 'DESC',
      PageRequest.of(params.page, params.limit),
    );
  }
}
