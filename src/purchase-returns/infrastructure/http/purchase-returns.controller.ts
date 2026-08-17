import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { AuditService } from '../../../audit/audit.service';
import { ApiErrorDto } from '../../../shared/infrastructure/http/api-error.dto';
import { CreatePurchaseReturnUseCase } from '../../application/create-purchase-return.use-case';
import { FindPurchaseReturnUseCase } from '../../application/find-purchase-return.use-case';
import { SearchPurchaseReturnsUseCase } from '../../application/search-purchase-returns.use-case';
import { CreatePurchaseReturnRequestDto } from './dto/create-purchase-return.request.dto';
import {
  PaginatedPurchaseReturnsResponseDto,
  PurchaseReturnResponseDto,
  PurchaseReturnSummaryResponseDto,
} from './dto/purchase-return.response.dto';
import { SearchPurchaseReturnsQueryDto } from './dto/search-purchase-returns.query.dto';

@ApiTags('purchase-returns')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('purchase-returns')
export class PurchaseReturnsController {
  constructor(
    private readonly searchPurchaseReturns: SearchPurchaseReturnsUseCase,
    private readonly findPurchaseReturn: FindPurchaseReturnUseCase,
    private readonly createPurchaseReturn: CreatePurchaseReturnUseCase,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar devoluciones de compra', description: 'Listado paginado, filtrable por compra y rango de fechas.' })
  @ApiOkResponse({ type: PaginatedPurchaseReturnsResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  async search(@Query() query: SearchPurchaseReturnsQueryDto): Promise<PaginatedPurchaseReturnsResponseDto> {
    const page = await this.searchPurchaseReturns.execute(query);
    return {
      items: page.items.map(PurchaseReturnSummaryResponseDto.fromSummary),
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
  @ApiOperation({ summary: 'Obtener devolucion de compra por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PurchaseReturnResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PurchaseReturnResponseDto> {
    const pr = await this.findPurchaseReturn.execute(id);
    return PurchaseReturnResponseDto.fromDomain(pr);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar devolucion de compra',
    description:
      'Genera una devolucion vinculada a una compra existente. ' +
      'El costo unitario de cada linea se toma de la compra original. ' +
      'Si se indica warehouseId, se genera un movimiento purchase_return (stock sale del almacen).',
  })
  @ApiCreatedResponse({ type: PurchaseReturnResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async create(
    @Body() dto: CreatePurchaseReturnRequestDto,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ): Promise<PurchaseReturnResponseDto> {
    const pr = await this.createPurchaseReturn.execute(dto);
    void this.audit.log('purchase_return', pr.id.value, 'CREATE', req.user?.email ?? 'system', { purchaseId: dto.purchaseId });
    return PurchaseReturnResponseDto.fromDomain(pr);
  }
}
