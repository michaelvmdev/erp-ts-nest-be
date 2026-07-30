import { InvalidInputError } from '../../shared/domain/domain.error';
import { Money } from '../../shared/domain/money.value-object';
import { PageRequest } from '../../shared/domain/pagination';
import { ClientId } from '../../clients/domain/value-objects/client-id.value-object';

export class InvalidSaleFilterError extends InvalidInputError {
  readonly code = 'INVALID_SALE_FILTER';

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
      throw new InvalidSaleFilterError(
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
      throw new InvalidSaleFilterError(
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
      throw new InvalidSaleFilterError(
        `El total minimo (${desde.toDecimalString()}) no puede superar al maximo (${hasta.toDecimalString()}).`,
      );
    }
    return new TotalRange(desde, hasta);
  }
}

export type SaleSortField = 'date' | 'number' | 'total';
export type SortDirection = 'ASC' | 'DESC';

export class SaleSearchCriteria {
  private constructor(
    readonly saleNumber: string | null,
    readonly saleTypeCode: string | null,
    readonly clientId: ClientId | null,
    readonly districtId: string | null,
    readonly departmentId: string | null,
    readonly dates: DateRange,
    readonly totals: TotalRange,
    readonly sortBy: SaleSortField,
    readonly sortDirection: SortDirection,
    readonly page: PageRequest,
  ) {}

  static of(params: {
    saleNumber?: string | null;
    saleTypeCode?: string | null;
    clientId?: ClientId | null;
    districtId?: string | null;
    departmentId?: string | null;
    dates?: DateRange;
    totals?: TotalRange;
    sortBy?: SaleSortField;
    sortDirection?: SortDirection;
    page?: number;
    limit?: number;
  }): SaleSearchCriteria {
    const numero = params.saleNumber?.trim();
    const codigo = params.saleTypeCode?.trim().toUpperCase();

    if (codigo && !/^[A-Z]{3}$/.test(codigo)) {
      throw new InvalidSaleFilterError(
        `saleTypeCode debe ser tres letras, se recibio "${params.saleTypeCode}".`,
      );
    }
    const distrito = params.districtId?.trim();
    if (distrito && !/^[0-9]{6}$/.test(distrito)) {
      throw new InvalidSaleFilterError(
        `districtId debe tener 6 digitos, se recibio "${params.districtId}".`,
      );
    }
    const departamento = params.departmentId?.trim();
    if (departamento && !/^[0-9]{2}$/.test(departamento)) {
      throw new InvalidSaleFilterError(
        `departmentId debe tener 2 digitos, se recibio "${params.departmentId}".`,
      );
    }

    return new SaleSearchCriteria(
      numero ? numero.toUpperCase() : null,
      codigo ? codigo : null,
      params.clientId ?? null,
      distrito ? distrito : null,
      departamento ? departamento : null,
      params.dates ?? DateRange.of(),
      params.totals ?? TotalRange.of(),
      // Por fecha descendente: lo habitual al listar ventas es querer las
      // ultimas, no las de hace dos anos.
      params.sortBy ?? 'date',
      params.sortDirection ?? 'DESC',
      PageRequest.of(params.page, params.limit),
    );
  }
}
