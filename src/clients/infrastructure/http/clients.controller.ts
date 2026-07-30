import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../../../shared/infrastructure/http/api-error.dto';
import { CreateClientUseCase } from '../../application/create-client.use-case';
import { FindClientUseCase } from '../../application/find-client.use-case';
import { SearchClientsUseCase } from '../../application/search-clients.use-case';
import { UpdateClientUseCase } from '../../application/update-client.use-case';
import {
  ClientResponseDto,
  PaginatedClientsResponseDto,
} from './dto/client.response.dto';
import { CreateClientRequestDto } from './dto/create-client.request.dto';
import { ListClientsQueryDto } from './dto/list-clients.query.dto';
import { UpdateClientRequestDto } from './dto/update-client.request.dto';

const UUID_EJEMPLO = '5b8f3c21-9d4e-4a7b-8c16-2f9e1d3a5b7c';

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  constructor(
    private readonly findClient: FindClientUseCase,
    private readonly searchClients: SearchClientsUseCase,
    private readonly createClient: CreateClientUseCase,
    private readonly updateClient: UpdateClientUseCase,
  ) {}

  // La ruta sin parametro va declarada antes que ':clientId' para que no se
  // interprete como un identificador.
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener varios clientes',
    description:
      'Listado paginado. Todos los parametros son opcionales y se combinan con AND; ' +
      'sin ninguno devuelve la primera pagina del padron completo.\n\n' +
      'La busqueda por `documentNumber` es exacta y no parcial: el documento identifica ' +
      'a un unico cliente, asi que quien lo escribe completo espera esa fila.',
  })
  @ApiOkResponse({
    description: 'Pagina de clientes. La lista es vacia si nada coincide.',
    type: PaginatedClientsResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Parametro invalido: estado no booleano, pagina o limite fuera de rango.',
    type: ApiErrorDto,
  })
  async list(
    @Query() query: ListClientsQueryDto,
  ): Promise<PaginatedClientsResponseDto> {
    const page = await this.searchClients.execute({
      clientDescription: query.clientDescription,
      documentNumber: query.documentNumber,
      documentTypeId: query.documentTypeId,
      clientActive: query.clientActive,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return {
      items: page.items.map((c) => ClientResponseDto.fromDomain(c)),
      meta: {
        page: page.page,
        limit: page.limit,
        total: page.total,
        totalPages: page.totalPages,
        hasNextPage: page.page < page.totalPages,
        hasPreviousPage: page.page > 1,
      },
    };
  }

  @Get(':clientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener un cliente',
    description: 'Devuelve un cliente por su identificador, este activo o no.',
  })
  @ApiParam({ name: 'clientId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({
    description: 'Cliente encontrado.',
    type: ClientResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El id no es un UUID valido.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe un cliente con ese id.',
    type: ApiErrorDto,
  })
  async findOne(
    @Param('clientId', new ParseUUIDPipe({ version: '4' })) clientId: string,
  ): Promise<ClientResponseDto> {
    const client = await this.findClient.execute(clientId);
    return ClientResponseDto.fromDomain(client);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo cliente',
    description:
      'El `clientId` lo genera el backend: no se acepta en el cuerpo.\n\n' +
      'El numero de documento debe corresponder al tipo enviado. Un DNI de 11 digitos ' +
      'o un RUC que no empiece en 10 o 20 se rechazan con 400.',
  })
  @ApiCreatedResponse({
    description: 'Cliente creado.',
    type: ClientResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'El cuerpo no supera la validacion, o el documento no corresponde al tipo.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'El tipo de documento indicado no existe.',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description: 'Ya hay un cliente registrado con ese numero de documento.',
    type: ApiErrorDto,
  })
  async create(
    @Body() dto: CreateClientRequestDto,
  ): Promise<ClientResponseDto> {
    const client = await this.createClient.execute(dto);
    return ClientResponseDto.fromDomain(client);
  }

  @Patch(':clientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Modificar, activar o desactivar un cliente',
    description:
      'Actualizacion parcial: solo se modifican los campos presentes en el cuerpo.\n\n' +
      'Para desactivar un cliente basta con enviar `{"clientActive": false}`, y `true` lo ' +
      'reactiva. No existe DELETE a proposito: un cliente desactivado conserva su ' +
      'historial de compras, asi que la unica baja posible es logica.\n\n' +
      'Tipo y numero de documento se validan siempre juntos. Si se envia solo el tipo, ' +
      'el numero vigente debe cumplir el formato del tipo nuevo; de lo contrario hay que ' +
      'enviar ambos.',
  })
  @ApiParam({ name: 'clientId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({
    description: 'Cliente actualizado.',
    type: ClientResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Id o cuerpo invalidos, o el documento no corresponde al tipo.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe el cliente, o el tipo de documento indicado.',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description: 'El documento nuevo ya pertenece a otro cliente.',
    type: ApiErrorDto,
  })
  async update(
    @Param('clientId', new ParseUUIDPipe({ version: '4' })) clientId: string,
    @Body() dto: UpdateClientRequestDto,
  ): Promise<ClientResponseDto> {
    const client = await this.updateClient.execute(clientId, dto);
    return ClientResponseDto.fromDomain(client);
  }
}
