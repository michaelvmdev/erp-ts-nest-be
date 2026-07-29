import { DocumentType } from '../../domain/document-type';
import { DocumentTypeId } from '../../domain/document-type-id.value-object';
import { DocumentTypeOrmEntity } from './document-type.orm-entity';

export class DocumentTypeMapper {
  static toDomain(row: DocumentTypeOrmEntity): DocumentType {
    return DocumentType.rehydrate({
      id: DocumentTypeId.of(row.documentTypeId),
      description: row.documentTypeDescription,
    });
  }
}
