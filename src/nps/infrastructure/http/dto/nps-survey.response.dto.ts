import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NpsSurvey } from '../../../domain/nps-survey';
import { NpsScoreResult } from '../../../application/get-nps-score.use-case';
import { NpsAnalyticsResult } from '../../../application/get-nps-analytics.use-case';
import { PageMetaDto } from '../../../../products/infrastructure/http/dto/product.response.dto';

export class NpsSurveyResponseDto {
  @ApiProperty({ format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  surveyId!: string;

  @ApiProperty({ format: 'uuid', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  saleId!: string;

  @ApiProperty({ minimum: 0, maximum: 10, example: 9 })
  score!: number;

  @ApiProperty({
    enum: ['promoter', 'passive', 'detractor'],
    example: 'promoter',
    description:
      'Promotores 9-10 | Pasivos 7-8 | Detractores 0-6',
  })
  category!: string;

  @ApiPropertyOptional({
    example: 'Excelente atencion y entrega rapida.',
    description: 'Comentario libre del cliente. Puede estar ausente.',
    nullable: true,
  })
  comment!: string | null;

  @ApiProperty({ format: 'date-time', example: '2026-08-10T14:30:00.000Z' })
  createdAt!: string;

  static fromDomain(survey: NpsSurvey): NpsSurveyResponseDto {
    const s = survey.toSnapshot();
    const dto = new NpsSurveyResponseDto();
    dto.surveyId = s.id;
    dto.saleId = s.saleId;
    dto.score = s.score;
    dto.category = s.category;
    dto.comment = s.comment;
    dto.createdAt = s.createdAt.toISOString();
    return dto;
  }
}

export class PaginatedNpsSurveysResponseDto {
  @ApiProperty({ type: [NpsSurveyResponseDto] })
  items!: NpsSurveyResponseDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}

export class NpsScoreResponseDto {
  @ApiProperty({ example: 150 })
  totalResponses!: number;

  @ApiProperty({ example: 80 })
  promoters!: number;

  @ApiProperty({ example: 40 })
  passives!: number;

  @ApiProperty({ example: 30 })
  detractors!: number;

  @ApiProperty({ example: 53.33, description: 'Porcentaje de promotores.' })
  promotersPct!: number;

  @ApiProperty({ example: 26.67, description: 'Porcentaje de pasivos.' })
  passivesPct!: number;

  @ApiProperty({ example: 20.0, description: 'Porcentaje de detractores.' })
  detractorsPct!: number;

  @ApiProperty({
    example: 33.33,
    nullable: true,
    description:
      'Puntuacion NPS final: %promotores - %detractores. Rango -100 a +100. ' +
      'Null cuando no hay respuestas en el periodo.',
  })
  score!: number | null;

  @ApiPropertyOptional({ example: '2026-01-01', nullable: true })
  dateFrom!: string | null;

  @ApiPropertyOptional({ example: '2026-08-10', nullable: true })
  dateTo!: string | null;

  static from(result: NpsScoreResult): NpsScoreResponseDto {
    const dto = new NpsScoreResponseDto();
    Object.assign(dto, result);
    return dto;
  }
}

export class NpsCategoryStatsDto {
  @ApiProperty() categoryId!: string;
  @ApiProperty() categoryName!: string;
  @ApiProperty() totalSurveys!: number;
  @ApiProperty() promoters!: number;
  @ApiProperty() passives!: number;
  @ApiProperty() detractors!: number;
  @ApiProperty({ nullable: true }) npsScore!: number | null;
}

export class NpsProductStatsDto {
  @ApiProperty() productId!: string;
  @ApiProperty() productName!: string;
  @ApiProperty() categoryId!: string;
  @ApiProperty() categoryName!: string;
  @ApiProperty() totalSurveys!: number;
  @ApiProperty() promoters!: number;
  @ApiProperty() passives!: number;
  @ApiProperty() detractors!: number;
  @ApiProperty({ nullable: true }) npsScore!: number | null;
}

export class NpsAnalyticsResponseDto {
  @ApiProperty({ type: [NpsCategoryStatsDto] }) byCategory!: NpsCategoryStatsDto[];
  @ApiProperty({ type: [NpsProductStatsDto] }) byProduct!: NpsProductStatsDto[];
  @ApiPropertyOptional({ nullable: true }) dateFrom!: string | null;
  @ApiPropertyOptional({ nullable: true }) dateTo!: string | null;

  static from(result: NpsAnalyticsResult): NpsAnalyticsResponseDto {
    const dto = new NpsAnalyticsResponseDto();
    Object.assign(dto, result);
    return dto;
  }
}
