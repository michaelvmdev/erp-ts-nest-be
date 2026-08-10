import { UuidValueObject } from '../../../shared/domain/uuid.value-object';

export class NpsSurveyId extends UuidValueObject {
  static of(valor: string): NpsSurveyId {
    return new NpsSurveyId(this.ensureValid('El id de encuesta NPS', valor));
  }
}
