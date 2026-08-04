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

/**
 * El cliente figura en ventas ya registradas.
 *
 * Se responde 409 y no 500: la peticion es valida, pero choca con el estado del
 * sistema. Borrarlo dejaria huerfano el historico de ventas que lo referencia, y
 * la clave foranea de sales lo impide. La salida correcta es desactivarlo.
 */
export class ClientInUseError extends ConflictError {
  readonly code = 'CLIENT_IN_USE';

  constructor(clientId: string) {
    super(
      `El cliente ${clientId} no se puede eliminar porque figura en ventas registradas. ` +
        'Desactivalo con PATCH /clients/{clientId} enviando "clientActive": false.',
    );
  }
}
