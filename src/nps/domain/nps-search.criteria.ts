import { PageRequest } from '../../shared/domain/pagination';
import { NpsCategory } from './value-objects/nps-score.value-object';

export type NpsSortBy = 'score' | 'createdAt';
export type NpsSortDirection = 'ASC' | 'DESC';

export class NpsSearchCriteria {
  static readonly DEFAULT_LIMIT = 20;

  private constructor(
    readonly saleId: string | null,
    readonly category: NpsCategory | null,
    readonly scoreMin: number | null,
    readonly scoreMax: number | null,
    readonly dateFrom: Date | null,
    readonly dateTo: Date | null,
    readonly sortBy: NpsSortBy,
    readonly sortDirection: NpsSortDirection,
    readonly page: PageRequest,
  ) {}

  static of(params: {
    saleId?: string | null;
    category?: NpsCategory | null;
    scoreMin?: number | null;
    scoreMax?: number | null;
    dateFrom?: string | null;
    dateTo?: string | null;
    sortBy?: NpsSortBy;
    sortDirection?: NpsSortDirection;
    page?: number;
    limit?: number;
  }): NpsSearchCriteria {
    return new NpsSearchCriteria(
      params.saleId?.trim() || null,
      params.category ?? null,
      params.scoreMin ?? null,
      params.scoreMax ?? null,
      params.dateFrom ? new Date(params.dateFrom) : null,
      params.dateTo ? new Date(params.dateTo + 'T23:59:59.999Z') : null,
      params.sortBy ?? 'createdAt',
      params.sortDirection ?? 'DESC',
      PageRequest.of(params.page, params.limit ?? NpsSearchCriteria.DEFAULT_LIMIT),
    );
  }
}
