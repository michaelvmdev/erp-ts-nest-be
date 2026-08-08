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
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../../../shared/infrastructure/http/api-error.dto';
import { CreateCreditNoteUseCase } from '../../application/create-credit-note.use-case';
import { FindCreditNoteUseCase } from '../../application/find-credit-note.use-case';
import { SearchCreditNotesUseCase } from '../../application/search-credit-notes.use-case';
import { CreateCreditNoteRequestDto } from './dto/create-credit-note.request.dto';
import {
  CreditNoteResponseDto,
  PaginatedCreditNotesResponseDto,
  CreditNoteSummaryResponseDto,
} from './dto/credit-note.response.dto';
import { SearchCreditNotesQueryDto } from './dto/search-credit-notes.query.dto';

@ApiTags('credit-notes')
@Controller('credit-notes')
export class CreditNotesController {
  constructor(
    private readonly searchCreditNotes: SearchCreditNotesUseCase,
    private readonly findCreditNote: FindCreditNoteUseCase,
    private readonly createCreditNote: CreateCreditNoteUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar notas de credito', description: 'Listado paginado, filtrable por venta y rango de fechas.' })
  @ApiOkResponse({ type: PaginatedCreditNotesResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  async search(@Query() query: SearchCreditNotesQueryDto): Promise<PaginatedCreditNotesResponseDto> {
    const page = await this.searchCreditNotes.execute(query);
    return {
      items: page.items.map(CreditNoteSummaryResponseDto.fromSummary),
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
  @ApiOperation({ summary: 'Obtener nota de credito por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CreditNoteResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<CreditNoteResponseDto> {
    const cn = await this.findCreditNote.execute(id);
    return CreditNoteResponseDto.fromDomain(cn);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nota de credito',
    description:
      'Genera una nota de credito vinculada a una venta existente. ' +
      'El precio unitario de cada linea se toma de la venta original, ' +
      'por lo que solo se indica el producto y la cantidad a devolver.',
  })
  @ApiCreatedResponse({ type: CreditNoteResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async create(@Body() dto: CreateCreditNoteRequestDto): Promise<CreditNoteResponseDto> {
    const cn = await this.createCreditNote.execute(dto);
    return CreditNoteResponseDto.fromDomain(cn);
  }
}
