import { PageRequest } from '../../shared/domain/pagination';

export type WarehouseSortDirection = 'ASC' | 'DESC';

export class WarehouseSearchCriteria {
  static readonly DEFAULT_LIMIT = 50;

  private constructor(
    readonly code: string | null,
    readonly description: string | null,
    readonly active: boolean | null,
    readonly sortDirection: WarehouseSortDirection,
    readonly page: PageRequest,
  ) {}

  static of(params: {
    code?: string | null;
    description?: string | null;
    active?: boolean | null;
    sortDirection?: WarehouseSortDirection;
    page?: number;
    limit?: number;
  }): WarehouseSearchCriteria {
    const code = params.code?.trim().toUpperCase() || null;
    const description = params.description?.trim() || null;
    return new WarehouseSearchCriteria(
      code,
      description,
      params.active ?? null,
      params.sortDirection ?? 'ASC',
      PageRequest.of(params.page, params.limit ?? WarehouseSearchCriteria.DEFAULT_LIMIT),
    );
  }
}
