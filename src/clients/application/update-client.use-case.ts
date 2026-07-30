import { Inject, Injectable } from '@nestjs/common';
import { DocumentTypeId } from '../../document-types/domain/document-type-id.value-object';
import { Client } from '../domain/client';
import {
  ClientDocumentAlreadyExistsError,
  ClientNotFoundError,
  DocumentTypeNotFoundError,
} from '../domain/client.errors';
import {
  CLIENT_REPOSITORY,
  DOCUMENT_TYPE_EXISTENCE_CHECKER,
} from '../domain/client.repository';
import type {
  ClientRepository,
  DocumentTypeExistenceChecker,
} from '../domain/client.repository';
import { ClientDescription } from '../domain/value-objects/client-description.value-object';
import { ClientDocument } from '../domain/value-objects/client-document.value-object';
import { ClientId } from '../domain/value-objects/client-id.value-object';
import { UpdateClientCommand } from './client.commands';

@Injectable()
export class UpdateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clients: ClientRepository,
    @Inject(DOCUMENT_TYPE_EXISTENCE_CHECKER)
    private readonly documentTypes: DocumentTypeExistenceChecker,
  ) {}

  async execute(
    rawClientId: string,
    command: UpdateClientCommand,
  ): Promise<Client> {
    const id = ClientId.of(rawClientId);

    const client = await this.clients.findById(id);
    if (!client) {
      throw new ClientNotFoundError(id.value);
    }

    // Semantica PATCH: se compara contra `undefined`, no por veracidad, para que
    // `false` se aplique como el valor legitimo que es.
    if (command.clientDescription !== undefined) {
      client.rename(ClientDescription.of(command.clientDescription));
    }

    if (
      command.documentTypeId !== undefined ||
      command.documentNumber !== undefined
    ) {
      await this.cambiarDocumento(client, command, id);
    }

    if (command.clientActive !== undefined) {
      if (command.clientActive) {
        client.activate();
      } else {
        client.deactivate();
      }
    }

    await this.clients.update(client);
    return client;
  }

  /**
   * El documento se rearma completo aunque solo venga una de sus dos partes: la
   * que falta se toma del cliente actual. Asi el par siempre se valida junto y
   * cambiar solo el tipo no puede dejar un DNI de 11 digitos.
   *
   * Enviar unicamente `documentTypeId` suele fallar con 400, y esta bien que
   * asi sea: cambiar de DNI a RUC exige tambien el numero nuevo.
   */
  private async cambiarDocumento(
    client: Client,
    command: UpdateClientCommand,
    id: ClientId,
  ): Promise<void> {
    const actual = client.document;

    const typeId =
      command.documentTypeId !== undefined
        ? DocumentTypeId.of(command.documentTypeId)
        : actual.typeId;

    if (
      command.documentTypeId !== undefined &&
      !(await this.documentTypes.exists(typeId))
    ) {
      throw new DocumentTypeNotFoundError(typeId.value);
    }

    const numero =
      command.documentNumber !== undefined
        ? command.documentNumber
        : actual.number;

    const document = ClientDocument.of(typeId, numero);

    // Se excluye el propio cliente: reenviar su mismo documento no debe chocar
    // consigo mismo.
    const otro = await this.clients.findByDocumentNumber(document.number, id);
    if (otro) {
      throw new ClientDocumentAlreadyExistsError(document.number);
    }

    client.changeDocument(document);
  }
}
