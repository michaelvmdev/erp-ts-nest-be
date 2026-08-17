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
  Req,
  UseGuards,
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
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/guards/roles.decorator';
import { AuditService } from '../../../audit/audit.service';
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
@Roles('administrador', 'almacenero')
@UseGuards(JwtGuard, RolesGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(
    private readonly searchOrders: SearchPurchaseOrdersUseCase,
    private readonly findOrder: FindPurchaseOrderUseCase,
    private readonly createOrder: CreatePurchaseOrderUseCase,
    private readonly updateOrder: UpdatePurchaseOrderUseCase,
    private readonly audit: AuditService,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ): Promise<PurchaseOrderResponseDto> {
    const order = await this.updateOrder.execute(id, dto);
    void this.audit.log('purchase_order', id, 'UPDATE', req.user?.email ?? 'system', { status: dto.status, notes: dto.notes });
    return PurchaseOrderResponseDto.fromDomain(order);
  }

  @Patch(':id/submit-for-approval')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar orden a aprobación' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PurchaseOrderResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async submitForApproval(
    @Param('id', new ParseUUIDPipe()) id: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ): Promise<PurchaseOrderResponseDto> {
    const order = await this.updateOrder.execute(id, { status: 'pending_approval' });
    void this.audit.log('purchase_order', id, 'UPDATE', req.user?.email ?? 'system', { status: 'pending_approval' });
    return PurchaseOrderResponseDto.fromDomain(order);
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar orden de compra' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PurchaseOrderResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async approve(
    @Param('id', new ParseUUIDPipe()) id: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ): Promise<PurchaseOrderResponseDto> {
    const order = await this.updateOrder.execute(id, { status: 'approved' });
    void this.audit.log('purchase_order', id, 'UPDATE', req.user?.email ?? 'system', { status: 'approved', approvedBy: req.user?.email });
    return PurchaseOrderResponseDto.fromDomain(order);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rechazar orden de compra' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PurchaseOrderResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ): Promise<PurchaseOrderResponseDto> {
    const order = await this.updateOrder.execute(id, { status: 'rejected' });
    void this.audit.log('purchase_order', id, 'UPDATE', req.user?.email ?? 'system', { status: 'rejected', rejectedBy: req.user?.email });
    return PurchaseOrderResponseDto.fromDomain(order);
  }
}
