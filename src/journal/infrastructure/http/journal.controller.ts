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
import { CreateJournalEntryUseCase } from '../../application/create-journal-entry.use-case';
import { FindJournalEntryUseCase } from '../../application/find-journal-entry.use-case';
import { SearchJournalEntriesUseCase } from '../../application/search-journal-entries.use-case';
import { CreateJournalEntryRequestDto } from './dto/create-journal-entry.request.dto';
import { QueryJournalEntriesRequestDto } from './dto/query-journal-entries.request.dto';
import {
  JournalEntryDetailResponseDto,
  JournalEntrySummaryResponseDto,
} from './dto/journal-entry.response.dto';

@ApiTags('journal')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('journal')
export class JournalController {
  constructor(
    private readonly createEntry: CreateJournalEntryUseCase,
    private readonly findEntry: FindJournalEntryUseCase,
    private readonly searchEntries: SearchJournalEntriesUseCase,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar asientos del libro diario' })
  @ApiOkResponse({ description: 'Lista paginada de asientos' })
  async list(@Query() q: QueryJournalEntriesRequestDto): Promise<{
    items: JournalEntrySummaryResponseDto[];
    meta: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
  }> {
    const page = await this.searchEntries.execute({
      dateFrom:      q.dateFrom,
      dateTo:        q.dateTo,
      referenceType: q.referenceType,
      accountCode:   q.accountCode,
      page:          q.page  ?? 1,
      limit:         q.limit ?? 20,
    });
    return {
      items: page.items.map(JournalEntrySummaryResponseDto.fromSummary),
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
  @ApiOperation({ summary: 'Obtener asiento por ID' })
  @ApiOkResponse({ type: JournalEntryDetailResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<JournalEntryDetailResponseDto> {
    return JournalEntryDetailResponseDto.fromDomain(await this.findEntry.execute(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear asiento contable manual',
    description: 'Valida partida doble: suma de débitos = suma de créditos.',
  })
  @ApiCreatedResponse({ type: JournalEntryDetailResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  async create(
    @Body() dto: CreateJournalEntryRequestDto,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ): Promise<JournalEntryDetailResponseDto> {
    const entry = await this.createEntry.execute({
      entryDate:     dto.entryDate,
      description:   dto.description,
      referenceType: dto.referenceType,
      referenceId:   dto.referenceId,
      lines:         dto.lines,
    });
    void this.audit.log('journal_entry', entry.id.value, 'CREATE', req.user?.email ?? 'system', {
      entryNumber: entry.entryNumber,
      referenceType: dto.referenceType,
    });
    return JournalEntryDetailResponseDto.fromDomain(entry);
  }
}
