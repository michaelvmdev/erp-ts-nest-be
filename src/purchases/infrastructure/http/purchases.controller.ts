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
import { CreatePurchaseUseCase } from '../../application/create-purchase.use-case';
import { FindPurchaseUseCase } from '../../application/find-purchase.use-case';
import { SearchPurchasesUseCase } from '../../application/search-purchases.use-case';
import { UpdatePurchaseUseCase } from '../../application/update-purchase.use-case';
import { CreatePurchaseRequestDto } from './dto/create-purchase.request.dto';
import {
  PaginatedPurchasesResponseDto,
  PurchaseResponseDto,
  PurchaseSummaryResponseDto,
} from './dto/purchase.response.dto';
import { SearchPurchasesQueryDto } from './dto/search-purchases.query.dto';
import { UpdatePurchaseRequestDto } from './dto/update-purchase.request.dto';

const UUID_EJEMPLO = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

@ApiTags('purchases')
@Controller('purchases')
export class PurchasesController {
  constructor(
    private readonly findPurchase: FindPurchaseUseCase,
    private readonly searchPurchases: SearchPurchasesUseCase,
    private readonly createPurchase: CreatePurchaseUseCase,
    private readonly updatePurchase: UpdatePurchaseUseCase,
  ) {}

  // La ruta sin parametro va antes que ':purchaseId' para que no se interprete
  // como un identificador.
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar varias compras',
    description:
      'Listado paginado. Todos los filtros son opcionales y se combinan con AND; sin ' +
      'ninguno devuelve las compras mas recientes.\n\n' +
      'La respuesta trae solo las cabeceras, con `lineCount` para saber cuantos items ' +
      'tiene cada compra. El detalle completo se obtiene con `GET /purchases/{purchaseId}`.',
  })
  @ApiOkResponse({
    description: 'Pagina de compras. La lista es vacia si nada coincide.',
    type: PaginatedPurchasesResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Filtro invalido: fecha mal formada, rango invertido o limite fuera de rango.',
    type: ApiErrorDto,
  })
  async list(
    @Query() query: SearchPurchasesQueryDto,
  ): Promise<PaginatedPurchasesResponseDto> {
    const page = await this.searchPurchases.execute({
      supplierId: query.supplierId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      totalMin: query.totalMin,
      totalMax: query.totalMax,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return {
      items: page.items.map((p) => PurchaseSummaryResponseDto.fromSummary(p)),
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

  @Get(':purchaseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar una compra',
    description: 'Devuelve la compra con todas sus lineas de detalle.',
  })
  @ApiParam({ name: 'purchaseId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({
    description: 'Compra encontrada.',
    type: PurchaseResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El id no es un UUID valido.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe una compra con ese id.',
    type: ApiErrorDto,
  })
  async findOne(
    @Param('purchaseId', new ParseUUIDPipe({ version: '4' }))
    purchaseId: string,
  ): Promise<PurchaseResponseDto> {
    const purchase = await this.findPurchase.execute(purchaseId);
    return PurchaseResponseDto.fromDomain(purchase);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una compra',
    description:
      'Registra una compra a un proveedor. El cuerpo lleva el proveedor y las lineas con ' +
      'producto, cantidad y **costo unitario**.\n\n' +
      '**A diferencia de una venta, aqui si se envia el `unitPrice`**: es el costo pagado ' +
      'al proveedor, un dato que no esta en el catalogo (products solo guarda el precio de ' +
      'venta). El `partial`, el `subTotal`, el `igv` y el `total` los calcula el backend; ' +
      'enviarlos devuelve 400.\n\n' +
      'La compra no lleva numero de comprobante: no es un documento fiscal que esta API emita.',
  })
  @ApiCreatedResponse({
    description: 'Compra registrada.',
    type: PurchaseResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'El cuerpo no supera la validacion, o un producto se repite en dos lineas.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe el proveedor o alguno de los productos.',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description: 'El proveedor esta inactivo.',
    type: ApiErrorDto,
  })
  async create(
    @Body() dto: CreatePurchaseRequestDto,
  ): Promise<PurchaseResponseDto> {
    const purchase = await this.createPurchase.execute(dto);
    return PurchaseResponseDto.fromDomain(purchase);
  }

  @Patch(':purchaseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Corregir una compra',
    description:
      'Actualizacion parcial: solo se modifican los campos presentes en el cuerpo. Se ' +
      'pueden corregir el proveedor, la fecha, la hora y las lineas.\n\n' +
      'A diferencia de una venta, la fecha y la hora **si** se pueden corregir: una compra ' +
      'no es un documento fiscal. Los importes no se reciben; si viene `purchaseDetails`, ' +
      'reemplaza por completo las lineas y recalcula subtotal, IGV y total.',
  })
  @ApiParam({ name: 'purchaseId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({
    description: 'Compra actualizada.',
    type: PurchaseResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Id o cuerpo invalidos.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe la compra, el proveedor o algun producto.',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description: 'El proveedor esta inactivo.',
    type: ApiErrorDto,
  })
  async update(
    @Param('purchaseId', new ParseUUIDPipe({ version: '4' }))
    purchaseId: string,
    @Body() dto: UpdatePurchaseRequestDto,
  ): Promise<PurchaseResponseDto> {
    const purchase = await this.updatePurchase.execute(purchaseId, dto);
    return PurchaseResponseDto.fromDomain(purchase);
  }
}
