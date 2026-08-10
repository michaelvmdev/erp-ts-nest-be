import { ConflictError, NotFoundError } from '../../shared/domain/domain.error';

export class NpsSurveyNotFoundError extends NotFoundError {
  readonly code = 'NPS_SURVEY_NOT_FOUND';

  constructor(surveyId: string) {
    super(`No existe una encuesta NPS con id ${surveyId}.`);
  }
}

/**
 * La venta referenciada no existe.
 *
 * Se responde 404 y no 422: la peticion tiene forma valida, pero el recurso
 * al que apunta no existe. Separarlo de NpsSurveyNotFoundError evita que el
 * cliente confunda "no encontre la encuesta" con "no encontre la venta".
 */
export class NpsSaleNotFoundError extends NotFoundError {
  readonly code = 'SALE_NOT_FOUND';

  constructor(saleId: string) {
    super(`No existe una venta con id ${saleId}.`);
  }
}

/**
 * Ya hay una encuesta para esa venta.
 *
 * El NPS se mide una sola vez por transaccion: enviar una segunda encuesta
 * para la misma venta contamina la muestra.
 */
export class NpsSurveyAlreadyExistsError extends ConflictError {
  readonly code = 'NPS_SURVEY_ALREADY_EXISTS';

  constructor(saleId: string) {
    super(`La venta ${saleId} ya tiene una encuesta NPS registrada.`);
  }
}
