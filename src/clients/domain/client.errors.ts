import { ConflictError, NotFoundError } from '../../shared/domain/domain.error';

export class ClientNotFoundError extends NotFoundError {
  readonly code = 'CLIENT_NOT_FOUND';

  constructor(clientId: string) {
    super(`No existe un cliente con id ${clientId}.`);
  }
}

export class DocumentTypeNotFoundError extends NotFoundError {
  readonly code = 'DOCUMENT_TYPE_NOT_FOUND';

  constructor(documentTypeId: number) {
    super(`No existe un tipo de documento con id ${documentTypeId}.`);
  }
}

/**
 * Ya hay un cliente registrado con ese numero de documento.
 *
 * El numero identifica a la persona o empresa, asi que dos clientes con el mismo
 * documento son en realidad un duplicado del mismo.
 */
export class ClientDocumentAlreadyExistsError extends ConflictError {
  readonly code = 'CLIENT_DOCUMENT_ALREADY_EXISTS';

  constructor(documentNumber: string) {
    super(
      `Ya existe un cliente registrado con el documento ${documentNumber}.`,
    );
  }
}
