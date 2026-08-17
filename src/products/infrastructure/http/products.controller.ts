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
import { CreateProductUseCase } from '../../application/create-product.use-case';
import { DeleteProductUseCase } from '../../application/delete-product.use-case';
import { FindProductUseCase } from '../../application/find-product.use-case';
import { SearchProductsUseCase } from '../../application/search-products.use-case';
import { UpdateProductUseCase } from '../../application/update-product.use-case';
import { CreateProductRequestDto } from './dto/create-product.request.dto';
import {
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from './dto/product.response.dto';
import { QueryProductsRequestDto } from './dto/query-products.request.dto';
import { UpdateProductRequestDto } from './dto/update-product.request.dto';

const UUID_EJEMPLO = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

/**
 * Adaptador de entrada HTTP.
 *
 * Su unica responsabilidad es traducir: peticion HTTP hacia comando de
 * aplicacion, y agregado de dominio hacia DTO de respuesta. No tiene logica de
 * negocio ni habla con la base. Los errores no se capturan aqui: suben al
 * DomainExceptionFilter, que centraliza la correspondencia con codigos HTTP.
 */
@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly findProduct: FindProductUseCase,
    private readonly searchProducts: SearchProductsUseCase,
    private readonly createProduct: CreateProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly deleteProduct: DeleteProductUseCase,
  ) {}

  @Get(':productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar un producto',
    description:
      'Devuelve un producto por su identificador, sin importar si esta activo.',
  })
  @ApiParam({ name: 'productId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({
    description: 'Producto encontrado.',
    type: ProductResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El id no es un UUID valido.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe un producto con ese id.',
    type: ApiErrorDto,
  })
  async findOne(
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
  ): Promise<ProductResponseDto> {
    const product = await this.findProduct.execute(productId);
    return ProductResponseDto.fromDomain(product);
  }

  @Post('query')
  // 200 y no 201: la peticion es una consulta, no crea nada. El verbo es POST
  // solo porque el filtro viaja en el cuerpo.
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar varios productos con filtros y paginado',
    description:
      'Busqueda paginada. Todos los filtros son opcionales y se combinan con AND; ' +
      'un cuerpo vacio `{}` devuelve la primera pagina del catalogo completo.\n\n' +
      'Se usa POST porque el filtro es un objeto anidado que no encaja bien en la query string. ' +
      'La operacion es de solo lectura y no tiene efectos secundarios.',
  })
  @ApiOkResponse({
    description: 'Pagina de resultados. La lista es vacia si nada coincide.',
    type: PaginatedProductsResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Filtro invalido: UUID mal formado, rango de precio invertido o limite fuera de rango.',
    type: ApiErrorDto,
  })
  async query(
    @Body() dto: QueryProductsRequestDto,
  ): Promise<PaginatedProductsResponseDto> {
    const page = await this.searchProducts.execute({
      productDescription: dto.productDescription,
      productUnitPrice: dto.productUnitPrice,
      brandId: dto.brandId,
      productActive: dto.productActive,
      sortBy: dto.sortBy,
      sortDirection: dto.sortDirection,
      page: dto.page,
      limit: dto.limit,
    });

    return {
      items: page.items.map((p) => ProductResponseDto.fromDomain(p)),
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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Agregar un producto',
    description:
      'Crea un producto. El `productId` lo genera el backend: no se acepta en el cuerpo.',
  })
  @ApiCreatedResponse({
    description: 'Producto creado.',
    type: ProductResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El cuerpo no supera la validacion.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'La marca indicada no existe.',
    type: ApiErrorDto,
  })
  async create(
    @Body() dto: CreateProductRequestDto,
  ): Promise<ProductResponseDto> {
    const product = await this.createProduct.execute(dto);
    return ProductResponseDto.fromDomain(product);
  }

  @Patch(':productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Modificar un producto',
    description:
      'Actualizacion parcial: solo se modifican los campos presentes en el cuerpo. ' +
      'Enviar `null` en `productDescription` o `productImage` borra ese valor, ' +
      'que es distinto de omitirlos.',
  })
  @ApiParam({ name: 'productId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({
    description: 'Producto actualizado.',
    type: ProductResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Id o cuerpo invalidos.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe el producto o la marca indicada.',
    type: ApiErrorDto,
  })
  async update(
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
    @Body() dto: UpdateProductRequestDto,
  ): Promise<ProductResponseDto> {
    const product = await this.updateProduct.execute(productId, dto);
    return ProductResponseDto.fromDomain(product);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un producto (soft delete)',
    description:
      'Baja logica: el registro se marca con `deleted_at` y deja de aparecer en consultas. ' +
      'El historial de ventas queda intacto. Para retirar temporalmente un producto de la venta ' +
      'sin eliminarlo, usa PATCH con `"productActive": false`.',
  })
  @ApiParam({ name: 'productId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiNoContentResponse({
    description: 'Producto eliminado. Sin cuerpo de respuesta.',
  })
  @ApiBadRequestResponse({
    description: 'El id no es un UUID valido.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe un producto con ese id.',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description: 'El producto esta referenciado por ventas registradas.',
    type: ApiErrorDto,
  })
  async remove(
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
  ): Promise<void> {
    await this.deleteProduct.execute(productId);
  }
}
