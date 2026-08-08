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
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { ApiErrorDto } from '../../../shared/infrastructure/http/api-error.dto';
import { CreatePurchaseOrderUseCase } from '../../application/create-purchase-order.use-case';
import { FindPurchaseOrderUseCase } from '../../application/find-purchase-order.use-case';
import { SearchPurchaseOrdersUseCase } from '../../application/search-purchase-orders.use-case';
import { UpdatePurchaseOrderUseCase } from '../../application/update-purchase-order.use-case';
import { CreatePurchaseOrderRequestDto } from './dto/create-purchase-order.request.dto';
import {
  PaginatedPurchaseOrdersResponseDto,
  PurchaseOrderResponseDto,
  PurchaseOrderSummaryResponseDto,
} from './dto/purchase-order.response.dto';
import { SearchPurchaseOrdersQueryDto } from './dto/search-purchase-orders.query.dto';
import { UpdatePurchaseOrderRequestDto } from './dto/update-purchase-order.request.dto';

@ApiTags('purchase-orders')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(
    private readonly searchOrders: SearchPurchaseOrdersUseCase,
    private readonly findOrder: FindPurchaseOrderUseCase,
    private readonly createOrder: CreatePurchaseOrderUseCase,
    private readonly updateOrder: UpdatePurchaseOrderUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar ordenes de compra' })
  @ApiOkResponse({ type: PaginatedPurchaseOrdersResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  async search(@Query() query: SearchPurchaseOrdersQueryDto): Promise<PaginatedPurchaseOrdersResponseDto> {
    const page = await this.searchOrders.execute(query);
    return {
      items: page.items.map(PurchaseOrderSummaryResponseDto.fromSummary),
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

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener orden de compra por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PurchaseOrderResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<PurchaseOrderResponseDto> {
    const order = await this.findOrder.execute(id);
    return PurchaseOrderResponseDto.fromDomain(order);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear orden de compra',
    description: 'Crea una nueva orden en estado "pending". Los importes se calculan a partir de las lineas.',
  })
  @ApiCreatedResponse({ type: PurchaseOrderResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async create(@Body() dto: CreatePurchaseOrderRequestDto): Promise<PurchaseOrderResponseDto> {
    const order = await this.createOrder.execute(dto);
    return PurchaseOrderResponseDto.fromDomain(order);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar estado o notas de una orden',
    description: 'Permite avanzar el estado (pending→partial→received, pending→cancelled) y editar las notas.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PurchaseOrderResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiConflictResponse({ description: 'Transicion de estado no permitida.', type: ApiErrorDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePurchaseOrderRequestDto,
  ): Promise<PurchaseOrderResponseDto> {
    const order = await this.updateOrder.execute(id, dto);
    return PurchaseOrderResponseDto.fromDomain(order);
  }
}
