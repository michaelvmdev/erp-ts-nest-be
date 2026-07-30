import { InvalidInputError } from '../../../shared/domain/domain.error';
import { DocumentTypeId } from '../../../document-types/domain/document-type-id.value-object';

export class InvalidClientDocumentError extends InvalidInputError {
  readonly code = 'INVALID_CLIENT_DOCUMENT';

  constructor(message: string) {
    super(message);
  }
}

/**
 * Identificadores de los tipos conocidos.
 *
 * Son enteros fijos que forman parte del contrato, no valores que haya que
 * descubrir consultando el catalogo. Se nombran aqui para que las reglas de mas
 * abajo se lean en terminos del negocio y no como numeros sueltos.
 */
export const TIPO_DNI = 1;
export const TIPO_RUC = 2;

/**
 * Documento de identidad de un cliente: el tipo y el numero, juntos.
 *
 * Van en un mismo value object porque la regla que los relaciona no pertenece a
 * ninguno de los dos por separado. Un "8" no es valido ni invalido en si mismo;
 * lo es en funcion del tipo que lo acompana. Modelarlos como dos campos sueltos
 * dejaria esa regla suelta en algun servicio, donde es facil olvidarse de ella.
 *
 * Reglas, segun SUNAT:
 *   - DNI: exactamente 8 digitos.
 *   - RUC: exactamente 11 digitos, que empiezan en 10 (persona natural) o en 20
 *     (persona juridica).
 *
 * Un tipo que no sea DNI ni RUC solo se valida con la forma general (8 u 11
 * digitos). Asi, agregar carnet de extranjeria o pasaporte al catalogo no rompe
 * las altas mientras no se defina su regla propia, que iria en este archivo.
 */
export class ClientDocument {
  private constructor(
    readonly typeId: DocumentTypeId,
    readonly number: string,
  ) {}

  static of(typeId: DocumentTypeId, numero: string): ClientDocument {
    const limpio = numero?.trim() ?? '';

    if (!/^[0-9]+$/.test(limpio)) {
      throw new InvalidClientDocumentError(
        `El numero de documento solo admite digitos, se recibio "${numero}".`,
      );
    }

    switch (typeId.value) {
      case TIPO_DNI:
        if (limpio.length !== 8) {
          throw new InvalidClientDocumentError(
            `El DNI debe tener 8 digitos, se recibio uno de ${limpio.length}.`,
          );
        }
        break;

      case TIPO_RUC:
        if (limpio.length !== 11) {
          throw new InvalidClientDocumentError(
            `El RUC debe tener 11 digitos, se recibio uno de ${limpio.length}.`,
          );
        }
        if (!/^(10|20)/.test(limpio)) {
          throw new InvalidClientDocumentError(
            `El RUC debe empezar en 10 para persona natural o en 20 para persona juridica, ` +
              `se recibio uno que empieza en ${limpio.slice(0, 2)}.`,
          );
        }
        break;

      default:
        // Tipo aun sin regla propia: se exige solo una longitud admitida.
        if (limpio.length !== 8 && limpio.length !== 11) {
          throw new InvalidClientDocumentError(
            `El numero de documento debe tener 8 u 11 digitos, se recibio uno de ${limpio.length}.`,
          );
        }
    }

    return new ClientDocument(typeId, limpio);
  }

  equals(otro: ClientDocument): boolean {
    return this.typeId.equals(otro.typeId) && this.number === otro.number;
  }
}
