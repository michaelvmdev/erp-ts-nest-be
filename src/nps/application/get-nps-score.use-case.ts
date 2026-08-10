import { Inject, Injectable } from '@nestjs/common';
import { NPS_REPOSITORY } from '../domain/nps-survey.repository';
import type { NpsSurveyRepository } from '../domain/nps-survey.repository';
import { GetNpsScoreQuery } from './nps.commands';

export interface NpsScoreResult {
  readonly totalResponses: number;
  readonly promoters: number;
  readonly passives: number;
  readonly detractors: number;
  readonly promotersPct: number;
  readonly passivesPct: number;
  readonly detractorsPct: number;
  /** Puntuacion final: de -100 a +100. Null cuando no hay respuestas. */
  readonly score: number | null;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
}

@Injectable()
export class GetNpsScoreUseCase {
  constructor(
    @Inject(NPS_REPOSITORY)
    private readonly surveys: NpsSurveyRepository,
  ) {}

  async execute(query: GetNpsScoreQuery): Promise<NpsScoreResult> {
    const from = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const to = query.dateTo
      ? new Date(query.dateTo + 'T23:59:59.999Z')
      : undefined;

    const stats = await this.surveys.getStats(from, to);

    const total = stats.total;
    const promotersPct = total > 0 ? (stats.promoters / total) * 100 : 0;
    const passivesPct = total > 0 ? (stats.passives / total) * 100 : 0;
    const detractorsPct = total > 0 ? (stats.detractors / total) * 100 : 0;

    // Formula NPS: %promotores - %detractores, rango -100 a +100.
    const score = total > 0 ? promotersPct - detractorsPct : null;

    return {
      totalResponses: total,
      promoters: stats.promoters,
      passives: stats.passives,
      detractors: stats.detractors,
      promotersPct: round2(promotersPct),
      passivesPct: round2(passivesPct),
      detractorsPct: round2(detractorsPct),
      score: score !== null ? round2(score) : null,
      dateFrom: query.dateFrom ?? null,
      dateTo: query.dateTo ?? null,
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
