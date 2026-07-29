import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListDocumentTypesUseCase } from '../../application/list-document-types.use-case';
import { DocumentTypeResponseDto } from './dto/document-type.response.dto';

@ApiTags('document-types')
@Controller('document-types')
export class DocumentTypesController {
  constructor(private readonly listDocumentTypes: ListDocumentTypesUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todos los tipos de documento',
    description:
      'Devuelve el catalogo completo ordenado por identificador: primero DNI, despues RUC.\n\n' +
      'La respuesta es un arreglo plano, sin envoltorio de paginado: el catalogo es fijo y ' +
      'de dos elementos, asi que un `meta` que nunca cambia solo agregaria ruido.',
  })
  @ApiOkResponse({
    description: 'Catalogo de tipos de documento.',
    type: [DocumentTypeResponseDto],
  })
  async findAll(): Promise<DocumentTypeResponseDto[]> {
    const documentTypes = await this.listDocumentTypes.execute();
    return documentTypes.map((d) => DocumentTypeResponseDto.fromDomain(d));
  }
}
