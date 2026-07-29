import { Inject, Injectable } from '@nestjs/common';
import { DocumentType } from '../domain/document-type';
import { DOCUMENT_TYPE_REPOSITORY } from '../domain/document-type.repository';
import type { DocumentTypeRepository } from '../domain/document-type.repository';

@Injectable()
export class ListDocumentTypesUseCase {
  constructor(
    @Inject(DOCUMENT_TYPE_REPOSITORY)
    private readonly documentTypes: DocumentTypeRepository,
  ) {}

  execute(): Promise<DocumentType[]> {
    return this.documentTypes.findAll();
  }
}
