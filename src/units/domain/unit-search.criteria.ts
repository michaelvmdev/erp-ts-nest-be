import { PageRequest } from '../../shared/domain/pagination';

export type UnitSortDirection = 'ASC' | 'DESC';

export class UnitSearchCriteria {
  static readonly DEFAULT_LIMIT = 50;

  private constructor(
    readonly code: string | null,
    readonly description: string | null,
    readonly active: boolean | null,
    readonly sortDirection: UnitSortDirection,
    readonly page: PageRequest,
  ) {}

  static of(params: {
    code?: string | null;
    description?: string | null;
    active?: boolean | null;
    sortDirection?: UnitSortDirection;
    page?: number;
    limit?: number;
  }): UnitSearchCriteria {
    const code = params.code?.trim().toUpperCase() || null;
    const description = params.description?.trim() || null;
    return new UnitSearchCriteria(
      code,
      description,
      params.active ?? null,
      params.sortDirection ?? 'ASC',
      PageRequest.of(params.page, params.limit ?? UnitSearchCriteria.DEFAULT_LIMIT),
    );
  }
}
