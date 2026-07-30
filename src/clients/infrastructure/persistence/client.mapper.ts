import { DocumentTypeId } from '../../../document-types/domain/document-type-id.value-object';
import { Client } from '../../domain/client';
import { ClientDescription } from '../../domain/value-objects/client-description.value-object';
import { ClientDocument } from '../../domain/value-objects/client-document.value-object';
import { ClientId } from '../../domain/value-objects/client-id.value-object';
import { ClientOrmEntity } from './client.orm-entity';

export class ClientMapper {
  static toDomain(row: ClientOrmEntity): Client {
    return Client.rehydrate({
      id: ClientId.of(row.clientId),
      description: ClientDescription.of(row.clientDescription),
      document: ClientDocument.of(
        DocumentTypeId.of(row.documentTypeId),
        row.documentNumber,
      ),
      active: row.clientActive,
    });
  }

  static toPersistence(client: Client): ClientOrmEntity {
    const snapshot = client.toSnapshot();

    const row = new ClientOrmEntity();
    row.clientId = snapshot.id;
    row.clientDescription = snapshot.description;
    row.documentTypeId = snapshot.documentTypeId;
    row.documentNumber = snapshot.documentNumber;
    row.clientActive = snapshot.active;
    return row;
  }
}
