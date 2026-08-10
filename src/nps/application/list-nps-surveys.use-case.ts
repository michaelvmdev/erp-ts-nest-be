import { Inject, Injectable } from '@nestjs/common';
import { Page } from '../../shared/domain/pagination';
import { NpsSurvey } from '../domain/nps-survey';
import { NpsSearchCriteria } from '../domain/nps-search.criteria';
import { NPS_REPOSITORY } from '../domain/nps-survey.repository';
import type { NpsSurveyRepository } from '../domain/nps-survey.repository';
import { ListNpsSurveysQuery } from './nps.commands';

@Injectable()
export class ListNpsSurveysUseCase {
  constructor(
    @Inject(NPS_REPOSITORY)
    private readonly surveys: NpsSurveyRepository,
  ) {}

  async execute(query: ListNpsSurveysQuery): Promise<Page<NpsSurvey>> {
    const criteria = NpsSearchCriteria.of(query);
    return this.surveys.search(criteria);
  }
}
