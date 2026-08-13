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
import { ApiErrorDto } from '../../../shared/infrastructure/http/api-error.dto';
import { CreateNpsSurveyUseCase } from '../../application/create-nps-survey.use-case';
import { FindNpsSurveyUseCase } from '../../application/find-nps-survey.use-case';
import { GetNpsAnalyticsUseCase } from '../../application/get-nps-analytics.use-case';
import { GetNpsScoreUseCase } from '../../application/get-nps-score.use-case';
import { ListNpsSurveysUseCase } from '../../application/list-nps-surveys.use-case';
import { SendNpsCampaignUseCase } from '../../application/send-nps-campaign.use-case';
import { CreateNpsSurveyRequestDto } from './dto/create-nps-survey.request.dto';
import { SendCampaignRequestDto } from './dto/send-campaign.request.dto';
import {
  ListNpsSurveysQueryDto,
  NpsAnalyticsQueryDto,
  NpsScoreQueryDto,
} from './dto/list-nps-surveys.query.dto';
import {
  NpsAnalyticsResponseDto,
  NpsScoreResponseDto,
  NpsSurveyResponseDto,
  PaginatedNpsSurveysResponseDto,
} from './dto/nps-survey.response.dto';

const UUID_EJEMPLO = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

@ApiTags('nps')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('nps')
export class NpsController {
  constructor(
    private readonly findSurvey: FindNpsSurveyUseCase,
    private readonly listSurveys: ListNpsSurveysUseCase,
    private readonly createSurvey: CreateNpsSurveyUseCase,
    private readonly getNpsScore: GetNpsScoreUseCase,
    private readonly getNpsAnalytics: GetNpsAnalyticsUseCase,
    private readonly sendCampaign: SendNpsCampaignUseCase,
  ) {}

  // "score" va declarado antes que ":surveyId" para que NestJS no lo
  // interprete como un identificador y lo enrute al caso de uso incorrecto.
  @Get('score')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Puntuacion NPS agregada',
    description:
      'Calcula el Net Promoter Score del periodo: porcentaje de promotores menos ' +
      'porcentaje de detractores. El resultado va de -100 a +100.\n\n' +
      'Si no hay respuestas en el periodo, `score` es `null` y los conteos son 0.\n\n' +
      'Sin filtros de fecha devuelve el NPS global de toda la historia.',
  })
  @ApiOkResponse({ type: NpsScoreResponseDto })
  @ApiBadRequestResponse({ description: 'Fecha con formato invalido.', type: ApiErrorDto })
  async score(@Query() query: NpsScoreQueryDto): Promise<NpsScoreResponseDto> {
    const result = await this.getNpsScore.execute({
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
    return NpsScoreResponseDto.from(result);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar encuestas NPS',
    description:
      'Listado paginado. Todos los parametros son opcionales; sin ninguno devuelve ' +
      'las ultimas 20 encuestas ordenadas por fecha descendente.',
  })
  @ApiOkResponse({ type: PaginatedNpsSurveysResponseDto })
  @ApiBadRequestResponse({ description: 'Parametro invalido.', type: ApiErrorDto })
  async list(
    @Query() query: ListNpsSurveysQueryDto,
  ): Promise<PaginatedNpsSurveysResponseDto> {
    const page = await this.listSurveys.execute({
      saleId: query.saleId,
      category: query.category,
      scoreMin: query.scoreMin,
      scoreMax: query.scoreMax,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return {
      items: page.items.map((s) => NpsSurveyResponseDto.fromDomain(s)),
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

  @Get('analytics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Analitica NPS por categoria y producto',
    description:
      'Devuelve el NPS desglosado por categoria de producto y por producto (top 20).\n\n' +
      'Usa COUNT(DISTINCT survey_id) para que una encuesta no se cuente mas de una vez ' +
      'aunque la venta incluya varios productos de la misma categoria.\n\n' +
      'Sin filtros de fecha devuelve el historico completo.',
  })
  @ApiOkResponse({ type: NpsAnalyticsResponseDto })
  @ApiBadRequestResponse({ description: 'Fecha con formato invalido.', type: ApiErrorDto })
  async analytics(@Query() query: NpsAnalyticsQueryDto): Promise<NpsAnalyticsResponseDto> {
    const result = await this.getNpsAnalytics.execute({
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
    return NpsAnalyticsResponseDto.from(result);
  }

  @Get(':surveyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consultar una encuesta NPS' })
  @ApiParam({ name: 'surveyId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({ type: NpsSurveyResponseDto })
  @ApiBadRequestResponse({ description: 'El id no es un UUID valido.', type: ApiErrorDto })
  @ApiNotFoundResponse({ description: 'No existe una encuesta con ese id.', type: ApiErrorDto })
  async findOne(
    @Param('surveyId', new ParseUUIDPipe({ version: '4' })) surveyId: string,
  ): Promise<NpsSurveyResponseDto> {
    const survey = await this.findSurvey.execute(surveyId);
    return NpsSurveyResponseDto.fromDomain(survey);
  }

  @Post('campaign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar campaña de email por segmento NPS',
    description:
      'Obtiene los emails de usuarios activos en el segmento indicado y simula el envio. ' +
      'Devuelve la lista de destinatarios y el total.',
  })
  @ApiOkResponse({ description: 'Campaña procesada.' })
  @ApiBadRequestResponse({ description: 'Cuerpo invalido.', type: ApiErrorDto })
  async campaign(@Body() dto: SendCampaignRequestDto) {
    return this.sendCampaign.execute(dto.segment, dto.subject);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una encuesta NPS',
    description:
      'Crea una encuesta ligada a una venta. Solo se admite una encuesta por venta; ' +
      'intentar una segunda responde 409 `NPS_SURVEY_ALREADY_EXISTS`.\n\n' +
      'Si la venta no existe, responde 404 `SALE_NOT_FOUND`.',
  })
  @ApiCreatedResponse({ type: NpsSurveyResponseDto })
  @ApiBadRequestResponse({ description: 'Cuerpo invalido.', type: ApiErrorDto })
  @ApiNotFoundResponse({ description: 'La venta no existe.', type: ApiErrorDto })
  @ApiConflictResponse({
    description: 'Ya existe una encuesta para esa venta.',
    type: ApiErrorDto,
  })
  async create(@Body() dto: CreateNpsSurveyRequestDto): Promise<NpsSurveyResponseDto> {
    const survey = await this.createSurvey.execute({
      saleId: dto.saleId,
      score: dto.score,
      comment: dto.comment,
    });
    return NpsSurveyResponseDto.fromDomain(survey);
  }
}
