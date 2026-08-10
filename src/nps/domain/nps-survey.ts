import { NpsCategory, NpsScore } from './value-objects/nps-score.value-object';
import { NpsSurveyId } from './value-objects/nps-survey-id.value-object';

export interface NpsSurveySnapshot {
  readonly id: string;
  readonly saleId: string;
  readonly score: number;
  readonly category: NpsCategory;
  readonly comment: string | null;
  readonly createdAt: Date;
}

/**
 * Raiz del agregado EncuestaNPS.
 *
 * No tiene setters. Se construye por `create` (alta nueva) o `rehydrate`
 * (viene de la base). El dominio no conoce HTTP ni TypeORM.
 *
 * La encuesta es inmutable: no se puede cambiar la puntuacion una vez emitida,
 * igual que no se puede cambiar la fecha de una venta. Si se equivocaron, se
 * emite una nueva y se borra la anterior.
 */
export class NpsSurvey {
  private constructor(
    private readonly _id: NpsSurveyId,
    private readonly _saleId: string,
    private readonly _score: NpsScore,
    private readonly _comment: string | null,
    private readonly _createdAt: Date,
  ) {}

  static create(params: {
    id: NpsSurveyId;
    saleId: string;
    score: NpsScore;
    comment?: string | null;
  }): NpsSurvey {
    return new NpsSurvey(
      params.id,
      params.saleId,
      params.score,
      params.comment ?? null,
      new Date(),
    );
  }

  static rehydrate(params: {
    id: NpsSurveyId;
    saleId: string;
    score: NpsScore;
    comment: string | null;
    createdAt: Date;
  }): NpsSurvey {
    return new NpsSurvey(
      params.id,
      params.saleId,
      params.score,
      params.comment,
      params.createdAt,
    );
  }

  get id(): NpsSurveyId {
    return this._id;
  }

  get saleId(): string {
    return this._saleId;
  }

  get score(): NpsScore {
    return this._score;
  }

  get comment(): string | null {
    return this._comment;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  toSnapshot(): NpsSurveySnapshot {
    return {
      id: this._id.value,
      saleId: this._saleId,
      score: this._score.value,
      category: this._score.category,
      comment: this._comment,
      createdAt: this._createdAt,
    };
  }
}
