import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NpsSurvey } from '../domain/nps-survey';
import { NPS_REPOSITORY } from '../domain/nps-survey.repository';
import type { NpsSurveyRepository } from '../domain/nps-survey.repository';
import { NpsScore } from '../domain/value-objects/nps-score.value-object';
import { NpsSurveyId } from '../domain/value-objects/nps-survey-id.value-object';
import { CreateNpsSurveyCommand } from './nps.commands';

@Injectable()
export class CreateNpsSurveyUseCase {
  constructor(
    @Inject(NPS_REPOSITORY)
    private readonly surveys: NpsSurveyRepository,
  ) {}

  async execute(command: CreateNpsSurveyCommand): Promise<NpsSurvey> {
    const survey = NpsSurvey.create({
      id: NpsSurveyId.of(randomUUID()),
      saleId: command.saleId,
      score: NpsScore.of(command.score),
      comment: command.comment,
    });

    // La FK y el UNIQUE de la tabla detectan venta inexistente y encuesta
    // duplicada. El repositorio traduce ambas violaciones a errores de dominio.
    await this.surveys.insert(survey);
    return survey;
  }
}
