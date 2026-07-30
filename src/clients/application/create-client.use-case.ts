import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DocumentTypeId } from '../../document-types/domain/document-type-id.value-object';
import { Client } from '../domain/client';
import {
  ClientDocumentAlreadyExistsError,
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
import { CreateClientCommand } from './client.commands';

@Injectable()
export class CreateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clients: ClientRepository,
    @Inject(DOCUMENT_TYPE_EXISTENCE_CHECKER)
    private readonly documentTypes: DocumentTypeExistenceChecker,
  ) {}

  async execute(command: CreateClientCommand): Promise<Client> {
    const typeId = DocumentTypeId.of(command.documentTypeId);

    // Se comprueba antes de construir el documento para devolver 404 nombrando
    // el tipo. Sin esto, la clave foranea daria un 500 ilegible.
    if (!(await this.documentTypes.exists(typeId))) {
      throw new DocumentTypeNotFoundError(typeId.value);
    }

    // Aqui se valida que el numero corresponda al tipo: un DNI de 11 digitos no
    // llega a existir como objeto.
    const document = ClientDocument.of(typeId, command.documentNumber);

    const existente = await this.clients.findByDocumentNumber(document.number);
    if (existente) {
      throw new ClientDocumentAlreadyExistsError(document.number);
    }

    // El id lo genera el backend, igual que en productos y marcas.
    const client = Client.create({
      id: ClientId.of(randomUUID()),
      description: ClientDescription.of(command.clientDescription),
      document,
      active: command.clientActive,
    });

    await this.clients.insert(client);
    return client;
  }
}
