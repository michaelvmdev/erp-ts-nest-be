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

export interface NpsSurveyRepository {
  findById(id: NpsSurveyId): Promise<NpsSurvey | null>;

  search(criteria: NpsSearchCriteria): Promise<Page<NpsSurvey>>;

  insert(survey: NpsSurvey): Promise<void>;

  /**
   * Conteos de promotores, pasivos y detractores en el rango de fechas.
   *
   * El calculo del porcentaje y la puntuacion final es logica de negocio que
   * pertenece al caso de uso, no a la persistencia.
   */
  getStats(from?: Date, to?: Date): Promise<NpsStats>;
}

export const NPS_REPOSITORY = Symbol('NpsSurveyRepository');
