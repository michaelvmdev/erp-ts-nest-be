import { InvalidInputError } from '../../shared/domain/domain.error';
import { DocumentTypeId } from './document-type-id.value-object';

export class InvalidDocumentTypeError extends InvalidInputError {
  readonly code = 'INVALID_DOCUMENT_TYPE';

  constructor(message: string) {
    super(message);
  }
}

export interface DocumentTypeSnapshot {
  readonly id: number;
  readonly description: string;
}

/**
 * Raiz del agregado Tipo de documento (DNI, RUC).
 *
 * Solo expone `rehydrate` y no `create`, a proposito: el catalogo se siembra
 * desde db/db.sql porque sin el la tabla clients no puede referenciar nada. No
 * hay alta por API, y que el dominio no ofrezca un constructor de creacion lo
 * deja explicito en el codigo en vez de en un comentario.
 */
export class DocumentType {
  static readonly MAX_DESCRIPCION = 20;

  private constructor(
    private readonly _id: DocumentTypeId,
    private readonly _description: string,
  ) {}

  static rehydrate(params: {
    id: DocumentTypeId;
    description: string;
  }): DocumentType {
    const limpio = params.description?.trim() ?? '';

    if (limpio.length === 0) {
      throw new InvalidDocumentTypeError(
        'La descripcion del tipo de documento no puede estar vacia.',
      );
    }
    if (limpio.length > DocumentType.MAX_DESCRIPCION) {
      throw new InvalidDocumentTypeError(
        `La descripcion no puede superar ${DocumentType.MAX_DESCRIPCION} caracteres, tiene ${limpio.length}.`,
      );
    }

    return new DocumentType(params.id, limpio);
  }

  get id(): DocumentTypeId {
    return this._id;
  }

  get description(): string {
    return this._description;
  }

  toSnapshot(): DocumentTypeSnapshot {
    return { id: this._id.value, description: this._description };
  }
}
