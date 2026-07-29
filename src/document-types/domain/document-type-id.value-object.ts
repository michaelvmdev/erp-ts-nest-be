import { InvalidInputError } from '../../shared/domain/domain.error';

export class InvalidDocumentTypeIdError extends InvalidInputError {
  readonly code = 'INVALID_DOCUMENT_TYPE_ID';

  constructor(valor: unknown) {
    super(
      `El id de tipo de documento debe ser un entero positivo, se recibio "${String(valor)}".`,
    );
  }
}

/**
 * Identidad del agregado Tipo de documento.
 *
 * A diferencia de ProductId o BrandId, aqui el identificador es un entero y no
 * un UUID: es un catalogo fijo y corto cuyos valores forman parte del contrato
 * con el backend, que puede referirse al tipo 1 sin consultar la tabla.
 *
 * Aun asi tiene su propia clase. Un `number` suelto se confundiria con
 * cualquier otro entero del dominio; esto obliga a nombrar lo que se pasa.
 */
export class DocumentTypeId {
  private constructor(readonly value: number) {}

  static of(valor: number): DocumentTypeId {
    if (!Number.isInteger(valor) || valor < 1) {
      throw new InvalidDocumentTypeIdError(valor);
    }
    return new DocumentTypeId(valor);
  }

  equals(otro: DocumentTypeId): boolean {
    return otro.value === this.value;
  }

  toString(): string {
    return String(this.value);
  }
}
