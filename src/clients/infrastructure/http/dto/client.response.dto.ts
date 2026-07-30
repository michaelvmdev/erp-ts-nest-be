import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../../../../products/infrastructure/http/dto/product.response.dto';
import { Client } from '../../../domain/client';

export class ClientResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '5b8f3c21-9d4e-4a7b-8c16-2f9e1d3a5b7c',
    description:
      'Identificador del cliente. Lo genera el backend al dar de alta.',
  })
  clientId!: string;

  @ApiProperty({
    maxLength: 100,
    example: 'Comercial San Martin S.A.C.',
    description: 'Razon social de la empresa o nombre completo de la persona.',
  })
  clientDescription!: string;

  @ApiProperty({
    type: 'integer',
    example: 2,
    description:
      'Tipo de documento. Los valores disponibles se consultan en `GET /document-types`.',
  })
  documentTypeId!: number;

  @ApiProperty({
    maxLength: 11,
    example: '20100043212',
    description: 'Numero de documento. 8 digitos para DNI, 11 para RUC.',
  })
  documentNumber!: string;

  @ApiProperty({
    example: true,
    description:
      'Un cliente inactivo conserva su historial de compras; simplemente deja de ' +
      'ofrecerse para ventas nuevas.',
  })
  clientActive!: boolean;

  static fromDomain(client: Client): ClientResponseDto {
    const s = client.toSnapshot();
    const dto = new ClientResponseDto();
    dto.clientId = s.id;
    dto.clientDescription = s.description;
    dto.documentTypeId = s.documentTypeId;
    dto.documentNumber = s.documentNumber;
    dto.clientActive = s.active;
    return dto;
  }
}

export class PaginatedClientsResponseDto {
  @ApiProperty({ type: [ClientResponseDto] })
  items!: ClientResponseDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}
