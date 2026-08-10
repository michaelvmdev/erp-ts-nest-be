import { InvalidInputError } from '../../../shared/domain/domain.error';

export class InvalidNpsScoreError extends InvalidInputError {
  readonly code = 'INVALID_NPS_SCORE';

  constructor(valor: unknown) {
    super(
      `La puntuacion NPS debe ser un entero entre 0 y 10, se recibio "${valor}".`,
    );
  }
}

export type NpsCategory = 'promoter' | 'passive' | 'detractor';

/**
 * Puntuacion NPS de 0 a 10.
 *
 * La clasificacion es parte del value object porque depende del valor y no de
 * quien lo pregunta: 9 siempre es promotor, independientemente del contexto.
 */
export class NpsScore {
  static readonly MIN = 0;
  static readonly MAX = 10;

  private constructor(readonly value: number) {}

  static of(raw: unknown): NpsScore {
    const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
    if (!Number.isInteger(n) || n < NpsScore.MIN || n > NpsScore.MAX) {
      throw new InvalidNpsScoreError(raw);
    }
    return new NpsScore(n);
  }

  get category(): NpsCategory {
    if (this.value >= 9) return 'promoter';
    if (this.value >= 7) return 'passive';
    return 'detractor';
  }
}
