import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, Query, UseGuards } from '@nestjs/common';
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { ApiErrorDto } from '../../../shared/infrastructure/http/api-error.dto';
import { STOCK_WRITER, StockWriter } from '../../domain/stock-writer';
import { GetStockAlertsUseCase } from '../../application/get-stock-alerts.use-case';
import { GetStockLevelsUseCase } from '../../application/get-stock-levels.use-case';
import { GetStockMovementsUseCase } from '../../application/get-stock-movements.use-case';
import { TransferStockUseCase } from '../../application/transfer-stock.use-case';
import { NotifyStockAlertsUseCase } from '../../application/notify-stock-alerts.use-case';
import { GeneratePosUseCase } from '../../application/generate-pos.use-case';
import { GetStockLevelsQueryDto } from './dto/get-stock-levels.query.dto';
import { GetStockMovementsQueryDto } from './dto/get-stock-movements.query.dto';
import { TransferStockRequestDto } from './dto/transfer-stock.request.dto';
import {
  PaginatedStockLevelsResponseDto,
  StockLevelResponseDto,
} from './dto/stock-level.response.dto';
import {
  PaginatedStockMovementsResponseDto,
  StockMovementResponseDto,
} from './dto/stock-movement.response.dto';

class AdjustStockDto {
  @IsUUID() productId: string;
  @IsUUID() warehouseId: string;
  @IsNumber() @Min(0) newQuantity: number;
  @IsString() @IsOptional() notes?: string;
}

@ApiTags('stock')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('stock')
export class StockController {
  constructor(
    private readonly getStockLevels: GetStockLevelsUseCase,
    private readonly getStockMovements: GetStockMovementsUseCase,
    private readonly getStockAlerts: GetStockAlertsUseCase,
    private readonly transferStock: TransferStockUseCase,
    private readonly notifyAlerts: NotifyStockAlertsUseCase,
    private readonly generatePos: GeneratePosUseCase,
    @Inject(STOCK_WRITER) private readonly stockWriter: StockWriter,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar stock actual por producto y almacen',
    description:
      'Devuelve el saldo de cada producto en cada almacen, calculado como SUM(quantity) ' +
      'sobre los movimientos. Por defecto excluye productos con stock <= 0.',
  })
  @ApiOkResponse({ type: PaginatedStockLevelsResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  async stockLevels(
    @Query() query: GetStockLevelsQueryDto,
  ): Promise<PaginatedStockLevelsResponseDto> {
    const page = await this.getStockLevels.execute({
      warehouseId: query.warehouseId,
      productId: query.productId,
      includeEmpty: query.includeEmpty,
      page: query.page,
      limit: query.limit,
    });

    return {
      items: page.items.map((l) => StockLevelResponseDto.fromDomain(l)),
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

  @Get('movements')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Historial de movimientos de stock',
    description:
      'Devuelve los movimientos en orden descendente por fecha. Filtros opcionales: ' +
      'producto, almacen, tipo de movimiento y rango de fechas.',
  })
  @ApiOkResponse({ type: PaginatedStockMovementsResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  async movements(
    @Query() query: GetStockMovementsQueryDto,
  ): Promise<PaginatedStockMovementsResponseDto> {
    const page = await this.getStockMovements.execute({
      productId: query.productId,
      warehouseId: query.warehouseId,
      movementType: query.movementType,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: query.page,
      limit: query.limit,
    });

    return {
      items: page.items.map((m) => StockMovementResponseDto.fromDomain(m)),
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

  @Get('alerts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Alertas de stock bajo mínimo',
    description: 'Productos cuyo stock actual es inferior al minimum_stock configurado.',
  })
  @ApiOkResponse({ description: 'Lista de productos con stock insuficiente.' })
  async alerts() {
    return this.getStockAlerts.execute();
  }

  @Post('transfer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Transferencia entre almacenes',
    description:
      'Genera un movimiento transfer_out en el almacen de origen y un transfer_in en el destino.',
  })
  @ApiNoContentResponse({ description: 'Transferencia registrada correctamente.' })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  async transfer(@Body() dto: TransferStockRequestDto): Promise<void> {
    await this.transferStock.execute({
      productId: dto.productId,
      sourceWarehouseId: dto.sourceWarehouseId,
      destinationWarehouseId: dto.destinationWarehouseId,
      quantity: dto.quantity,
      notes: dto.notes,
    });
  }

  @Post('alerts/notify')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Enviar notificaciones de stock bajo mínimo',
    description: 'Comprueba todos los productos bajo mínimo y genera una notificación por usuario activo.',
  })
  @ApiNoContentResponse({ description: 'Notificaciones enviadas.' })
  async notifyStockAlerts(): Promise<void> {
    await this.notifyAlerts.execute();
  }

  @Post('alerts/generate-pos')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generar órdenes de compra sugeridas por alertas de stock',
    description:
      'Crea borradores de OC (estado pending) basados en el déficit actual de cada producto ' +
      'con stock bajo mínimo, usando el último proveedor registrado en compras anteriores.',
  })
  @ApiOkResponse({ description: 'Resultado con OCs creadas y productos sin proveedor histórico.' })
  async generatePurchaseOrders() {
    return this.generatePos.execute();
  }

  @Post('adjust')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Inventario físico — ajuste de stock',
    description: 'Registra la cantidad exacta contada en inventario físico. Genera un movimiento de tipo "adjustment" por la diferencia.',
  })
  @ApiOkResponse({ description: 'Movimiento de ajuste registrado.' })
  async adjustStock(@Body() dto: AdjustStockDto) {
    const levels = await this.getStockLevels.execute({ productId: dto.productId, warehouseId: dto.warehouseId, page: 1, limit: 1 });
    const current = levels.items[0]?.currentQuantity ?? 0;
    const delta = dto.newQuantity - current;
    if (delta !== 0) {
      await this.stockWriter.insertMovements([{
        productId:    dto.productId,
        warehouseId:  dto.warehouseId,
        movementType: 'adjustment',
        quantity:     delta,
        referenceId:  `adj-${Date.now()}`,
      }]);
    }
    return { productId: dto.productId, warehouseId: dto.warehouseId, previous: current, counted: dto.newQuantity, delta };
  }

}
