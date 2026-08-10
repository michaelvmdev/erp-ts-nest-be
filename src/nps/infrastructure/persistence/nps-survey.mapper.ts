import { NpsSurvey } from '../../domain/nps-survey';
import { NpsScore } from '../../domain/value-objects/nps-score.value-object';
import { NpsSurveyId } from '../../domain/value-objects/nps-survey-id.value-object';
import { NpsSurveyOrmEntity } from './nps-survey.orm-entity';

export class NpsSurveyMapper {
  static toDomain(row: NpsSurveyOrmEntity): NpsSurvey {
    return NpsSurvey.rehydrate({
      id: NpsSurveyId.of(row.surveyId),
      saleId: row.saleId,
      score: NpsScore.of(row.score),
      comment: row.comment,
      createdAt: row.createdAt,
    });
  }

  static toPersistence(survey: NpsSurvey): NpsSurveyOrmEntity {
    const s = survey.toSnapshot();
    const row = new NpsSurveyOrmEntity();
    row.surveyId = s.id;
    row.saleId = s.saleId;
    row.score = s.score;
    row.comment = s.comment;
    row.createdAt = s.createdAt;
    return row;
  }
}
