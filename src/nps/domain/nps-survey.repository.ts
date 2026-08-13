import { Page } from '../../shared/domain/pagination';
import { NpsSurvey } from './nps-survey';
import { NpsSearchCriteria } from './nps-search.criteria';
import { NpsSurveyId } from './value-objects/nps-survey-id.value-object';

export interface NpsStats {
  readonly total: number;
  readonly promoters: number;
  readonly passives: number;
  readonly detractors: number;
}

export interface NpsCategoryStats {
  readonly categoryId: string;
  readonly categoryName: string;
  readonly totalSurveys: number;
  readonly promoters: number;
  readonly passives: number;
  readonly detractors: number;
  readonly npsScore: number | null;
}

export interface NpsProductStats {
  readonly productId: string;
  readonly productName: string;
  readonly categoryId: string;
  readonly categoryName: string;
  readonly totalSurveys: number;
  readonly promoters: number;
  readonly passives: number;
  readonly detractors: number;
  readonly npsScore: number | null;
}

export interface NpsCampaignContact {
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
}

export interface NpsSurveyRepository {
  findById(id: NpsSurveyId): Promise<NpsSurvey | null>;

  search(criteria: NpsSearchCriteria): Promise<Page<NpsSurvey>>;

  insert(survey: NpsSurvey): Promise<void>;

  getEmailsBySegment(segment: 'promoter' | 'passive' | 'detractor'): Promise<NpsCampaignContact[]>;

  /**
   * Conteos de promotores, pasivos y detractores en el rango de fechas.
   *
   * El calculo del porcentaje y la puntuacion final es logica de negocio que
   * pertenece al caso de uso, no a la persistencia.
   */
  getStats(from?: Date, to?: Date): Promise<NpsStats>;

  /**
   * NPS agrupado por categoria de producto.
   * Usa COUNT(DISTINCT survey_id) para no duplicar encuestas cuando una venta
   * tiene varios productos de la misma categoria.
   */
  getAnalyticsByCategory(from?: Date, to?: Date): Promise<NpsCategoryStats[]>;

  /**
   * NPS agrupado por producto (top 20 por numero de encuestas).
   */
  getAnalyticsByProduct(from?: Date, to?: Date): Promise<NpsProductStats[]>;
}

export const NPS_REPOSITORY = Symbol('NpsSurveyRepository');
