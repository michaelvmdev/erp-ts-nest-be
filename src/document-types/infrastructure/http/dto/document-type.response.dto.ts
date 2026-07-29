import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '../../../domain/document-type';

export class DocumentTypeResponseDto {
  @ApiProperty({
    type: 'integer',
    example: 1,
    description:
      'Identificador del tipo de documento. Es un entero fijo que forma parte del ' +
      'contrato: 1 es DNI y 2 es RUC.',
  })
  documentTypeId!: number;

  @ApiProperty({
    maxLength: 20,
    example: 'DNI',
    description: 'Nombre del tipo de documento.',
  })
  documentTypeDescription!: string;

  static fromDomain(documentType: DocumentType): DocumentTypeResponseDto {
    const s = documentType.toSnapshot();
    const dto = new DocumentTypeResponseDto();
    dto.documentTypeId = s.id;
    dto.documentTypeDescription = s.description;
    return dto;
  }
}
