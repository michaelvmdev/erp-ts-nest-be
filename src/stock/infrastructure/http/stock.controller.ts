import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { ApiErrorDto } from '../../../shared/infrastructure/http/api-error.dto';
import { GetStockAlertsUseCase } from '../../application/get-stock-alerts.use-case';
import { GetStockLevelsUseCase } from '../../application/get-stock-levels.use-case';
import { GetStockMovementsUseCase } from '../../application/get-stock-movements.use-case';
import { GetStockLevelsQueryDto } from './dto/get-stock-levels.query.dto';
import { GetStockMovementsQueryDto } from './dto/get-stock-movements.query.dto';
import {
  PaginatedStockLevelsResponseDto,
  StockLevelResponseDto,
} from './dto/stock-level.response.dto';
import {
  PaginatedStockMovementsResponseDto,
  StockMovementResponseDto,
} from './dto/stock-movement.response.dto';

@ApiTags('stock')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('stock')
export class StockController {
  constructor(
    private readonly getStockLevels: GetStockLevelsUseCase,
    private readonly getStockMovements: GetStockMovementsUseCase,
    private readonly getStockAlerts: GetStockAlertsUseCase,
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

}
