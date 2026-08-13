import { Inject, Injectable } from '@nestjs/common';
import { NPS_REPOSITORY } from '../domain/nps-survey.repository';
import type {
  NpsCategoryStats,
  NpsProductStats,
  NpsSurveyRepository,
} from '../domain/nps-survey.repository';

export interface NpsAnalyticsResult {
  readonly byCategory: NpsCategoryStats[];
  readonly byProduct: NpsProductStats[];
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
}

@Injectable()
export class GetNpsAnalyticsUseCase {
  constructor(
    @Inject(NPS_REPOSITORY)
    private readonly surveys: NpsSurveyRepository,
  ) {}

  async execute(query: { dateFrom?: string; dateTo?: string }): Promise<NpsAnalyticsResult> {
    const from = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const to = query.dateTo ? new Date(query.dateTo + 'T23:59:59.999Z') : undefined;

    const [byCategory, byProduct] = await Promise.all([
      this.surveys.getAnalyticsByCategory(from, to),
      this.surveys.getAnalyticsByProduct(from, to),
    ]);

    return {
      byCategory,
      byProduct,
      dateFrom: query.dateFrom ?? null,
      dateTo: query.dateTo ?? null,
    };
  }
}
