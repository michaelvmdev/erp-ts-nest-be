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
import { CreateWarehouseUseCase } from '../../application/create-warehouse.use-case';
import { FindWarehouseUseCase } from '../../application/find-warehouse.use-case';
import { ListWarehousesUseCase } from '../../application/list-warehouses.use-case';
import { UpdateWarehouseUseCase } from '../../application/update-warehouse.use-case';
import {
  PaginatedWarehousesResponseDto,
  WarehouseResponseDto,
} from './dto/warehouse.response.dto';
import { CreateWarehouseRequestDto } from './dto/create-warehouse.request.dto';
import { ListWarehousesQueryDto } from './dto/list-warehouses.query.dto';
import { UpdateWarehouseRequestDto } from './dto/update-warehouse.request.dto';

const UUID_EJEMPLO = 'b2000000-0000-4000-8000-000000000001';

@ApiTags('warehouses')
@Controller('warehouses')
export class WarehousesController {
  constructor(
    private readonly findWarehouse: FindWarehouseUseCase,
    private readonly listWarehouses: ListWarehousesUseCase,
    private readonly createWarehouse: CreateWarehouseUseCase,
    private readonly updateWarehouse: UpdateWarehouseUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar almacenes',
    description: 'Listado paginado. Sin parametros devuelve los primeros 50 almacenes ordenados por codigo.',
  })
  @ApiOkResponse({ description: 'Pagina de almacenes.', type: PaginatedWarehousesResponseDto })
  @ApiBadRequestResponse({ description: 'Parametro invalido.', type: ApiErrorDto })
  async list(@Query() query: ListWarehousesQueryDto): Promise<PaginatedWarehousesResponseDto> {
    const page = await this.listWarehouses.execute({
      warehouseCode: query.warehouseCode,
      warehouseDescription: query.warehouseDescription,
      warehouseActive: query.warehouseActive,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return {
      items: page.items.map((w) => WarehouseResponseDto.fromDomain(w)),
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

  @Get(':warehouseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consultar un almacen' })
  @ApiParam({ name: 'warehouseId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({ description: 'Almacen encontrado.', type: WarehouseResponseDto })
  @ApiBadRequestResponse({ description: 'El id no es un UUID valido.', type: ApiErrorDto })
  @ApiNotFoundResponse({ description: 'No existe un almacen con ese id.', type: ApiErrorDto })
  async findOne(
    @Param('warehouseId', new ParseUUIDPipe({ version: '4' })) warehouseId: string,
  ): Promise<WarehouseResponseDto> {
    const warehouse = await this.findWarehouse.execute(warehouseId);
    return WarehouseResponseDto.fromDomain(warehouse);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un almacen',
    description: 'El `warehouseId` lo genera el backend. El `warehouseCode` es inmutable una vez creado.',
  })
  @ApiCreatedResponse({ description: 'Almacen creado.', type: WarehouseResponseDto })
  @ApiBadRequestResponse({ description: 'El cuerpo no supera la validacion.', type: ApiErrorDto })
  @ApiConflictResponse({ description: 'Ya existe un almacen con ese codigo.', type: ApiErrorDto })
  async create(@Body() dto: CreateWarehouseRequestDto): Promise<WarehouseResponseDto> {
    const warehouse = await this.createWarehouse.execute(dto);
    return WarehouseResponseDto.fromDomain(warehouse);
  }

  @Patch(':warehouseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Modificar o desactivar un almacen',
    description: 'Actualizacion parcial. Solo se puede cambiar la descripcion y el estado; el codigo es inmutable.',
  })
  @ApiParam({ name: 'warehouseId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({ description: 'Almacen actualizado.', type: WarehouseResponseDto })
  @ApiBadRequestResponse({ description: 'Id o cuerpo invalidos.', type: ApiErrorDto })
  @ApiNotFoundResponse({ description: 'No existe un almacen con ese id.', type: ApiErrorDto })
  async update(
    @Param('warehouseId', new ParseUUIDPipe({ version: '4' })) warehouseId: string,
    @Body() dto: UpdateWarehouseRequestDto,
  ): Promise<WarehouseResponseDto> {
    const warehouse = await this.updateWarehouse.execute(warehouseId, dto);
    return WarehouseResponseDto.fromDomain(warehouse);
  }
}
