import { PageRequest } from '../../shared/domain/pagination';

export type PriceListSortDirection = 'ASC' | 'DESC';

export class PriceListSearchCriteria {
  static readonly DEFAULT_LIMIT = 50;

  private constructor(
    readonly name: string | null,
    readonly active: boolean | null,
    readonly sortDirection: PriceListSortDirection,
    readonly page: PageRequest,
  ) {}

  static of(params: {
    name?: string | null;
    active?: boolean | null;
    sortDirection?: PriceListSortDirection;
    page?: number;
    limit?: number;
  }): PriceListSearchCriteria {
    const name = params.name?.trim() || null;
    return new PriceListSearchCriteria(
      name,
      params.active ?? null,
      params.sortDirection ?? 'ASC',
      PageRequest.of(params.page, params.limit ?? PriceListSearchCriteria.DEFAULT_LIMIT),
    );
  }
}
