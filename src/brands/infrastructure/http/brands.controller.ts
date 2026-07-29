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
import { CreateBrandUseCase } from '../../application/create-brand.use-case';
import { FindBrandUseCase } from '../../application/find-brand.use-case';
import { ListBrandsUseCase } from '../../application/list-brands.use-case';
import { UpdateBrandUseCase } from '../../application/update-brand.use-case';
import {
  BrandResponseDto,
  PaginatedBrandsResponseDto,
} from './dto/brand.response.dto';
import { CreateBrandRequestDto } from './dto/create-brand.request.dto';
import { ListBrandsQueryDto } from './dto/list-brands.query.dto';
import { UpdateBrandRequestDto } from './dto/update-brand.request.dto';

const UUID_EJEMPLO = '9c1e2f40-6b3a-4d21-8f77-1a2b3c4d5e6f';

@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(
    private readonly findBrand: FindBrandUseCase,
    private readonly listBrands: ListBrandsUseCase,
    private readonly createBrand: CreateBrandUseCase,
    private readonly updateBrand: UpdateBrandUseCase,
  ) {}

  // La ruta sin parametro va declarada antes que ':brandId' para que "brands"
  // no se interprete como un identificador.
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar marcas',
    description:
      'Listado paginado. Todos los parametros son opcionales; sin ninguno devuelve las ' +
      'primeras 50 marcas ordenadas alfabeticamente.\n\n' +
      'A diferencia de la busqueda de productos, aqui los filtros viajan en la query string: ' +
      'son planos y de solo lectura, asi que el GET queda cacheable.',
  })
  @ApiOkResponse({
    description: 'Pagina de marcas. La lista es vacia si nada coincide.',
    type: PaginatedBrandsResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Parametro invalido: estado no booleano, pagina o limite fuera de rango.',
    type: ApiErrorDto,
  })
  async list(
    @Query() query: ListBrandsQueryDto,
  ): Promise<PaginatedBrandsResponseDto> {
    const page = await this.listBrands.execute({
      brandDescription: query.brandDescription,
      brandActive: query.brandActive,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return {
      items: page.items.map((b) => BrandResponseDto.fromDomain(b)),
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

  @Get(':brandId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar una marca',
    description: 'Devuelve una marca por su identificador, este activa o no.',
  })
  @ApiParam({ name: 'brandId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({ description: 'Marca encontrada.', type: BrandResponseDto })
  @ApiBadRequestResponse({
    description: 'El id no es un UUID valido.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe una marca con ese id.',
    type: ApiErrorDto,
  })
  async findOne(
    @Param('brandId', new ParseUUIDPipe({ version: '4' })) brandId: string,
  ): Promise<BrandResponseDto> {
    const brand = await this.findBrand.execute(brandId);
    return BrandResponseDto.fromDomain(brand);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Agregar una marca',
    description:
      'Crea una marca. El `brandId` lo genera el backend: no se acepta en el cuerpo.',
  })
  @ApiCreatedResponse({ description: 'Marca creada.', type: BrandResponseDto })
  @ApiBadRequestResponse({
    description: 'El cuerpo no supera la validacion.',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description:
      'Ya existe una marca con esa descripcion, ignorando mayusculas y espacios.',
    type: ApiErrorDto,
  })
  async create(@Body() dto: CreateBrandRequestDto): Promise<BrandResponseDto> {
    const brand = await this.createBrand.execute(dto);
    return BrandResponseDto.fromDomain(brand);
  }

  @Patch(':brandId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Modificar o desactivar una marca',
    description:
      'Actualizacion parcial: solo se modifican los campos presentes en el cuerpo.\n\n' +
      'Para desactivar una marca basta con enviar `{"brandActive": false}`. No existe ' +
      'DELETE a proposito: sus productos la referencian por clave foranea y el historico ' +
      'de ventas depende de ellos, asi que la unica baja posible es logica.',
  })
  @ApiParam({ name: 'brandId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({ description: 'Marca actualizada.', type: BrandResponseDto })
  @ApiBadRequestResponse({
    description: 'Id o cuerpo invalidos.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe una marca con ese id.',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description: 'El nuevo nombre choca con otra marca existente.',
    type: ApiErrorDto,
  })
  async update(
    @Param('brandId', new ParseUUIDPipe({ version: '4' })) brandId: string,
    @Body() dto: UpdateBrandRequestDto,
  ): Promise<BrandResponseDto> {
    const brand = await this.updateBrand.execute(brandId, dto);
    return BrandResponseDto.fromDomain(brand);
  }
}
