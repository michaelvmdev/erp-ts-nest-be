import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiBadRequestResponse, ApiCreatedResponse,
  ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags,
} from '@nestjs/swagger';
import { AuditService } from '../../../audit/audit.service';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { ApiErrorDto } from '../../../shared/infrastructure/http/api-error.dto';
import { CreateLotUseCase } from '../../application/create-lot.use-case';
import { FindLotUseCase } from '../../application/find-lot.use-case';
import { SearchLotsUseCase } from '../../application/search-lots.use-case';
import { CreateLotRequestDto } from './dto/create-lot.request.dto';
import { SearchLotsQueryDto } from './dto/search-lots.query.dto';
import {
  LotDetailResponseDto, LotSummaryResponseDto, PaginatedLotsResponseDto,
} from './dto/lot.response.dto';

@ApiTags('lots')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('lots')
export class LotsController {
  constructor(
    private readonly createLot: CreateLotUseCase,
    private readonly findLot: FindLotUseCase,
    private readonly searchLots: SearchLotsUseCase,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar lotes', description: 'Ordenados por fecha de vencimiento ascendente.' })
  @ApiOkResponse({ type: PaginatedLotsResponseDto })
  async list(@Query() query: SearchLotsQueryDto): Promise<PaginatedLotsResponseDto> {
    const page = await this.searchLots.execute({
      productId:         query.productId,
      warehouseId:       query.warehouseId,
      status:            query.status,
      expiringBeforeDate: query.expiringBeforeDate,
      page:              query.page,
      limit:             query.limit,
    });
    return {
      items: page.items.map(LotSummaryResponseDto.fromSummary),
      meta: {
        page: page.page, limit: page.limit, total: page.total,
        totalPages: page.totalPages,
        hasNextPage: page.page < page.totalPages,
        hasPreviousPage: page.page > 1,
      },
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener lote por ID' })
  @ApiOkResponse({ type: LotDetailResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<LotDetailResponseDto> {
    return LotDetailResponseDto.fromDomain(await this.findLot.execute(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar lote',
    description: 'Crea un lote asociado a un producto y almacen. La cantidad inicial queda como stock disponible del lote.',
  })
  @ApiCreatedResponse({ type: LotDetailResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  async create(
    @Body() dto: CreateLotRequestDto,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ): Promise<LotDetailResponseDto> {
    const lot = await this.createLot.execute({
      lotNumber:         dto.lotNumber,
      productId:         dto.productId,
      warehouseId:       dto.warehouseId,
      manufacturingDate: dto.manufacturingDate,
      expirationDate:    dto.expirationDate,
      initialQuantity:   dto.initialQuantity,
      notes:             dto.notes,
    });
    void this.audit.log('lot', lot.id.value, 'CREATE', req.user?.email ?? 'system', {
      productId: dto.productId, warehouseId: dto.warehouseId,
    });
    return LotDetailResponseDto.fromDomain(lot);
  }
}
