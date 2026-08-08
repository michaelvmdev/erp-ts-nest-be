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
import { CreateUnitUseCase } from '../../application/create-unit.use-case';
import { FindUnitUseCase } from '../../application/find-unit.use-case';
import { ListUnitsUseCase } from '../../application/list-units.use-case';
import { UpdateUnitUseCase } from '../../application/update-unit.use-case';
import {
  PaginatedUnitsResponseDto,
  UnitResponseDto,
} from './dto/unit.response.dto';
import { CreateUnitRequestDto } from './dto/create-unit.request.dto';
import { ListUnitsQueryDto } from './dto/list-units.query.dto';
import { UpdateUnitRequestDto } from './dto/update-unit.request.dto';

const UUID_EJEMPLO = 'a1000000-0000-4000-8000-000000000001';

@ApiTags('units')
@Controller('units')
export class UnitsController {
  constructor(
    private readonly findUnit: FindUnitUseCase,
    private readonly listUnits: ListUnitsUseCase,
    private readonly createUnit: CreateUnitUseCase,
    private readonly updateUnit: UpdateUnitUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar unidades de medida',
    description:
      'Listado paginado. Sin parametros devuelve las primeras 50 unidades ordenadas por codigo.',
  })
  @ApiOkResponse({ description: 'Pagina de unidades.', type: PaginatedUnitsResponseDto })
  @ApiBadRequestResponse({ description: 'Parametro invalido.', type: ApiErrorDto })
  async list(@Query() query: ListUnitsQueryDto): Promise<PaginatedUnitsResponseDto> {
    const page = await this.listUnits.execute({
      unitCode: query.unitCode,
      unitDescription: query.unitDescription,
      unitActive: query.unitActive,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return {
      items: page.items.map((u) => UnitResponseDto.fromDomain(u)),
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

  @Get(':unitId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consultar una unidad de medida' })
  @ApiParam({ name: 'unitId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({ description: 'Unidad encontrada.', type: UnitResponseDto })
  @ApiBadRequestResponse({ description: 'El id no es un UUID valido.', type: ApiErrorDto })
  @ApiNotFoundResponse({ description: 'No existe una unidad con ese id.', type: ApiErrorDto })
  async findOne(
    @Param('unitId', new ParseUUIDPipe({ version: '4' })) unitId: string,
  ): Promise<UnitResponseDto> {
    const unit = await this.findUnit.execute(unitId);
    return UnitResponseDto.fromDomain(unit);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una unidad de medida',
    description:
      'Crea una unidad. El `unitId` lo genera el backend. El `unitCode` es inmutable una vez creado.',
  })
  @ApiCreatedResponse({ description: 'Unidad creada.', type: UnitResponseDto })
  @ApiBadRequestResponse({ description: 'El cuerpo no supera la validacion.', type: ApiErrorDto })
  @ApiConflictResponse({ description: 'Ya existe una unidad con ese codigo.', type: ApiErrorDto })
  async create(@Body() dto: CreateUnitRequestDto): Promise<UnitResponseDto> {
    const unit = await this.createUnit.execute(dto);
    return UnitResponseDto.fromDomain(unit);
  }

  @Patch(':unitId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Modificar o desactivar una unidad',
    description:
      'Actualizacion parcial. Solo se puede cambiar la descripcion y el estado; el codigo es inmutable.',
  })
  @ApiParam({ name: 'unitId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({ description: 'Unidad actualizada.', type: UnitResponseDto })
  @ApiBadRequestResponse({ description: 'Id o cuerpo invalidos.', type: ApiErrorDto })
  @ApiNotFoundResponse({ description: 'No existe una unidad con ese id.', type: ApiErrorDto })
  async update(
    @Param('unitId', new ParseUUIDPipe({ version: '4' })) unitId: string,
    @Body() dto: UpdateUnitRequestDto,
  ): Promise<UnitResponseDto> {
    const unit = await this.updateUnit.execute(unitId, dto);
    return UnitResponseDto.fromDomain(unit);
  }
}
