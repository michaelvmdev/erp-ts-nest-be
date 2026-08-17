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
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuditService } from '../../../audit/audit.service';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { ApiErrorDto } from '../../../shared/infrastructure/http/api-error.dto';
import { CreateQuoteUseCase } from '../../application/create-quote.use-case';
import { FindQuoteUseCase } from '../../application/find-quote.use-case';
import { SearchQuotesUseCase } from '../../application/search-quotes.use-case';
import { UpdateQuoteStatusUseCase } from '../../application/update-quote-status.use-case';
import { CreateQuoteRequestDto } from './dto/create-quote.request.dto';
import { UpdateQuoteStatusRequestDto } from './dto/update-quote-status.request.dto';
import { SearchQuotesQueryDto } from './dto/search-quotes.query.dto';
import {
  PaginatedQuotesResponseDto,
  QuoteDetailResponseDto,
  QuoteSummaryResponseDto,
} from './dto/quote.response.dto';

@ApiTags('quotes')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('quotes')
export class QuotesController {
  constructor(
    private readonly createQuote: CreateQuoteUseCase,
    private readonly findQuote: FindQuoteUseCase,
    private readonly searchQuotes: SearchQuotesUseCase,
    private readonly updateStatus: UpdateQuoteStatusUseCase,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar cotizaciones' })
  @ApiOkResponse({ type: PaginatedQuotesResponseDto })
  async list(@Query() query: SearchQuotesQueryDto): Promise<PaginatedQuotesResponseDto> {
    const page = await this.searchQuotes.execute({
      clientId: query.clientId,
      status:   query.status,
      dateFrom: query.dateFrom,
      dateTo:   query.dateTo,
      page:     query.page,
      limit:    query.limit,
    });
    return {
      items: page.items.map(QuoteSummaryResponseDto.fromSummary),
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
  @ApiOperation({ summary: 'Obtener cotizacion por ID' })
  @ApiOkResponse({ type: QuoteDetailResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<QuoteDetailResponseDto> {
    const quote = await this.findQuote.execute(id);
    return QuoteDetailResponseDto.fromDomain(quote);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear cotizacion' })
  @ApiCreatedResponse({ type: QuoteDetailResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  async create(
    @Body() dto: CreateQuoteRequestDto,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ): Promise<QuoteDetailResponseDto> {
    const quote = await this.createQuote.execute({
      clientId:   dto.clientId,
      date:       dto.date,
      validUntil: dto.validUntil,
      notes:      dto.notes,
      details:    dto.details,
    });
    void this.audit.log('quote', quote.id.value, 'CREATE', req.user?.email ?? 'system', { clientId: dto.clientId });
    return QuoteDetailResponseDto.fromDomain(quote);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar estado de cotizacion',
    description: 'Transiciones: draft→sent, draft→rejected, sent→accepted, sent→rejected, sent→expired.',
  })
  @ApiOkResponse({ type: QuoteDetailResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async changeStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateQuoteStatusRequestDto,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ): Promise<QuoteDetailResponseDto> {
    const quote = await this.updateStatus.execute({ quoteId: id, status: dto.status });
    void this.audit.log('quote', quote.id.value, 'UPDATE', req.user?.email ?? 'system', { status: dto.status });
    return QuoteDetailResponseDto.fromDomain(quote);
  }
}
