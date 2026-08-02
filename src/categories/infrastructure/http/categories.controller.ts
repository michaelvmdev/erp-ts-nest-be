import {
  Body,
  Controller,
  Delete,
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
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../../../shared/infrastructure/http/api-error.dto';
import { CreateCategoryUseCase } from '../../application/create-category.use-case';
import { DeleteCategoryUseCase } from '../../application/delete-category.use-case';
import { FindCategoryUseCase } from '../../application/find-category.use-case';
import { ListCategoriesUseCase } from '../../application/list-categories.use-case';
import { UpdateCategoryUseCase } from '../../application/update-category.use-case';
import {
  CategoryResponseDto,
  PaginatedCategoriesResponseDto,
} from './dto/category.response.dto';
import { CreateCategoryRequestDto } from './dto/create-category.request.dto';
import { ListCategoriesQueryDto } from './dto/list-categories.query.dto';
import { UpdateCategoryRequestDto } from './dto/update-category.request.dto';

const UUID_EJEMPLO = '9c1e2f40-6b3a-4d21-8f77-1a2b3c4d5e6f';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly findCategory: FindCategoryUseCase,
    private readonly listCategories: ListCategoriesUseCase,
    private readonly createCategory: CreateCategoryUseCase,
    private readonly updateCategory: UpdateCategoryUseCase,
    private readonly deleteCategory: DeleteCategoryUseCase,
  ) {}

  // La ruta sin parametro va declarada antes que ':categoryId' para que
  // "categories" no se interprete como un identificador.
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar categorias',
    description:
      'Listado paginado. Todos los parametros son opcionales; sin ninguno devuelve las ' +
      'primeras 50 categorias ordenadas alfabeticamente.',
  })
  @ApiOkResponse({
    description: 'Pagina de categorias. La lista es vacia si nada coincide.',
    type: PaginatedCategoriesResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Parametro invalido: estado no booleano, pagina o limite fuera de rango.',
    type: ApiErrorDto,
  })
  async list(
    @Query() query: ListCategoriesQueryDto,
  ): Promise<PaginatedCategoriesResponseDto> {
    const page = await this.listCategories.execute({
      categoryDescription: query.categoryDescription,
      categoryActive: query.categoryActive,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return {
      items: page.items.map((c) => CategoryResponseDto.fromDomain(c)),
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

  @Get(':categoryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar una categoria',
    description: 'Devuelve una categoria por su identificador, este activa o no.',
  })
  @ApiParam({ name: 'categoryId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({
    description: 'Categoria encontrada.',
    type: CategoryResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El id no es un UUID valido.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe una categoria con ese id.',
    type: ApiErrorDto,
  })
  async findOne(
    @Param('categoryId', new ParseUUIDPipe({ version: '4' }))
    categoryId: string,
  ): Promise<CategoryResponseDto> {
    const category = await this.findCategory.execute(categoryId);
    return CategoryResponseDto.fromDomain(category);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Agregar una categoria',
    description:
      'Crea una categoria. El `categoryId` lo genera el backend: no se acepta en el cuerpo.',
  })
  @ApiCreatedResponse({
    description: 'Categoria creada.',
    type: CategoryResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El cuerpo no supera la validacion.',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description:
      'Ya existe una categoria con esa descripcion, ignorando mayusculas y espacios.',
    type: ApiErrorDto,
  })
  async create(
    @Body() dto: CreateCategoryRequestDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.createCategory.execute(dto);
    return CategoryResponseDto.fromDomain(category);
  }

  @Patch(':categoryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Modificar o desactivar una categoria',
    description:
      'Actualizacion parcial: solo se modifican los campos presentes en el cuerpo.\n\n' +
      'Para desactivar una categoria basta con enviar `{"categoryActive": false}`.',
  })
  @ApiParam({ name: 'categoryId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({
    description: 'Categoria actualizada.',
    type: CategoryResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Id o cuerpo invalidos.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe una categoria con ese id.',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description: 'El nuevo nombre choca con otra categoria existente.',
    type: ApiErrorDto,
  })
  async update(
    @Param('categoryId', new ParseUUIDPipe({ version: '4' }))
    categoryId: string,
    @Body() dto: UpdateCategoryRequestDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.updateCategory.execute(categoryId, dto);
    return CategoryResponseDto.fromDomain(category);
  }

  @Delete(':categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una categoria',
    description:
      'Baja fisica. Si la categoria tiene productos asociados la operacion se rechaza con 409, ' +
      'porque borrarla dejaria huerfanos esos productos. En ese caso corresponde ' +
      'desactivarla con PATCH enviando `"categoryActive": false`.',
  })
  @ApiParam({ name: 'categoryId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiNoContentResponse({
    description: 'Categoria eliminada. Sin cuerpo de respuesta.',
  })
  @ApiBadRequestResponse({
    description: 'El id no es un UUID valido.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe una categoria con ese id.',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description: 'La categoria esta referenciada por productos.',
    type: ApiErrorDto,
  })
  async remove(
    @Param('categoryId', new ParseUUIDPipe({ version: '4' }))
    categoryId: string,
  ): Promise<void> {
    await this.deleteCategory.execute(categoryId);
  }
}
