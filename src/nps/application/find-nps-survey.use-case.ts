import { Inject, Injectable } from '@nestjs/common';
import { NpsSurvey } from '../domain/nps-survey';
import { NpsSurveyNotFoundError } from '../domain/nps-survey.errors';
import { NPS_REPOSITORY } from '../domain/nps-survey.repository';
import type { NpsSurveyRepository } from '../domain/nps-survey.repository';
import { NpsSurveyId } from '../domain/value-objects/nps-survey-id.value-object';

@Injectable()
export class FindNpsSurveyUseCase {
  constructor(
    @Inject(NPS_REPOSITORY)
    private readonly surveys: NpsSurveyRepository,
  ) {}

  async execute(surveyId: string): Promise<NpsSurvey> {
    const id = NpsSurveyId.of(surveyId);
    const survey = await this.surveys.findById(id);
    if (!survey) {
      throw new NpsSurveyNotFoundError(surveyId);
    }
    return survey;
  }
}
