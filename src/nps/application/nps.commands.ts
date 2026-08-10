export interface CreateNpsSurveyCommand {
  readonly saleId: string;
  readonly score: number;
  readonly comment?: string | null;
}

export interface ListNpsSurveysQuery {
  readonly saleId?: string | null;
  readonly category?: 'promoter' | 'passive' | 'detractor' | null;
  readonly scoreMin?: number | null;
  readonly scoreMax?: number | null;
  readonly dateFrom?: string | null;
  readonly dateTo?: string | null;
  readonly sortBy?: 'score' | 'createdAt';
  readonly sortDirection?: 'ASC' | 'DESC';
  readonly page?: number;
  readonly limit?: number;
}

export interface GetNpsScoreQuery {
  readonly dateFrom?: string | null;
  readonly dateTo?: string | null;
}
