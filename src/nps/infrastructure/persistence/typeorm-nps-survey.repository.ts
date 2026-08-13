import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Page } from '../../../shared/domain/pagination';
import { NpsSurvey } from '../../domain/nps-survey';
import { NpsSearchCriteria } from '../../domain/nps-search.criteria';
import {
  NpsSaleNotFoundError,
  NpsSurveyAlreadyExistsError,
} from '../../domain/nps-survey.errors';
import {
  NpsCampaignContact,
  NpsCategoryStats,
  NpsProductStats,
  NpsSurveyRepository,
  NpsStats,
} from '../../domain/nps-survey.repository';
import { NpsSurveyId } from '../../domain/value-objects/nps-survey-id.value-object';
import { NpsSurveyMapper } from './nps-survey.mapper';
import { NpsSurveyOrmEntity } from './nps-survey.orm-entity';

const PG_FK_VIOLATION     = '23503';
const PG_UNIQUE_VIOLATION = '23505';

function esErrorPostgres(error: unknown, codigo: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === codigo
  );
}

@Injectable()
export class TypeOrmNpsSurveyRepository implements NpsSurveyRepository {
  constructor(
    @InjectRepository(NpsSurveyOrmEntity)
    private readonly surveys: Repository<NpsSurveyOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: NpsSurveyId): Promise<NpsSurvey | null> {
    const row = await this.surveys.findOne({ where: { surveyId: id.value } });
    return row ? NpsSurveyMapper.toDomain(row) : null;
  }

  async search(criteria: NpsSearchCriteria): Promise<Page<NpsSurvey>> {
    const qb = this.surveys.createQueryBuilder('n');

    if (criteria.saleId) {
      qb.andWhere('n.saleId = :saleId', { saleId: criteria.saleId });
    }

    if (criteria.scoreMin !== null) {
      qb.andWhere('n.score >= :scoreMin', { scoreMin: criteria.scoreMin });
    }

    if (criteria.scoreMax !== null) {
      qb.andWhere('n.score <= :scoreMax', { scoreMax: criteria.scoreMax });
    }

    if (criteria.category) {
      if (criteria.category === 'promoter') {
        qb.andWhere('n.score >= 9');
      } else if (criteria.category === 'passive') {
        qb.andWhere('n.score >= 7 AND n.score <= 8');
      } else {
        qb.andWhere('n.score <= 6');
      }
    }

    if (criteria.dateFrom) {
      qb.andWhere('n.createdAt >= :dateFrom', { dateFrom: criteria.dateFrom });
    }

    if (criteria.dateTo) {
      qb.andWhere('n.createdAt <= :dateTo', { dateTo: criteria.dateTo });
    }

    const col = criteria.sortBy === 'score' ? 'n.score' : 'n.createdAt';
    qb.orderBy(col, criteria.sortDirection)
      .addOrderBy('n.surveyId', 'ASC')
      .skip(criteria.page.offset)
      .take(criteria.page.limit);

    const [rows, total] = await qb.getManyAndCount();

    return new Page(
      rows.map((r) => NpsSurveyMapper.toDomain(r)),
      total,
      criteria.page.page,
      criteria.page.limit,
    );
  }

  async insert(survey: NpsSurvey): Promise<void> {
    try {
      await this.surveys.insert(NpsSurveyMapper.toPersistence(survey));
    } catch (error) {
      if (esErrorPostgres(error, PG_FK_VIOLATION)) {
        throw new NpsSaleNotFoundError(survey.saleId);
      }
      if (esErrorPostgres(error, PG_UNIQUE_VIOLATION)) {
        throw new NpsSurveyAlreadyExistsError(survey.saleId);
      }
      throw error;
    }
  }

  async getAnalyticsByCategory(from?: Date, to?: Date): Promise<NpsCategoryStats[]> {
    const rows: Array<{
      categoryId: string;
      categoryName: string;
      totalSurveys: number;
      promoters: number;
      passives: number;
      detractors: number;
      npsScore: string | null;
    }> = await this.dataSource.query(
      `SELECT
         c.category_id                                                               AS "categoryId",
         c.category_description                                                      AS "categoryName",
         (COUNT(DISTINCT n.survey_id))::int                                          AS "totalSurveys",
         (COUNT(DISTINCT n.survey_id) FILTER (WHERE n.score >= 9))::int              AS "promoters",
         (COUNT(DISTINCT n.survey_id) FILTER (WHERE n.score BETWEEN 7 AND 8))::int  AS "passives",
         (COUNT(DISTINCT n.survey_id) FILTER (WHERE n.score <= 6))::int              AS "detractors",
         CASE
           WHEN COUNT(DISTINCT n.survey_id) = 0 THEN NULL
           ELSE ROUND(
             (
               (COUNT(DISTINCT n.survey_id) FILTER (WHERE n.score >= 9))::numeric
               - (COUNT(DISTINCT n.survey_id) FILTER (WHERE n.score <= 6))::numeric
             ) / COUNT(DISTINCT n.survey_id)::numeric * 100,
             2
           )
         END                                                                         AS "npsScore"
       FROM nps_surveys n
       JOIN sales s          ON s.sale_id     = n.sale_id
       JOIN sale_details sd  ON sd.sale_id    = s.sale_id
       JOIN products p       ON p.product_id  = sd.product_id
       JOIN categories c     ON c.category_id = p.category_id
      WHERE ($1::timestamptz IS NULL OR n.created_at >= $1)
        AND ($2::timestamptz IS NULL OR n.created_at <= $2)
      GROUP BY c.category_id, c.category_description
      ORDER BY COUNT(DISTINCT n.survey_id) DESC`,
      [from ?? null, to ?? null],
    );

    return rows.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      totalSurveys: r.totalSurveys,
      promoters: r.promoters,
      passives: r.passives,
      detractors: r.detractors,
      npsScore: r.npsScore !== null ? parseFloat(r.npsScore) : null,
    }));
  }

  async getAnalyticsByProduct(from?: Date, to?: Date): Promise<NpsProductStats[]> {
    const rows: Array<{
      productId: string;
      productName: string;
      categoryId: string;
      categoryName: string;
      totalSurveys: number;
      promoters: number;
      passives: number;
      detractors: number;
      npsScore: string | null;
    }> = await this.dataSource.query(
      `SELECT
         p.product_id                                                                AS "productId",
         p.product_name                                                              AS "productName",
         c.category_id                                                               AS "categoryId",
         c.category_description                                                      AS "categoryName",
         (COUNT(DISTINCT n.survey_id))::int                                          AS "totalSurveys",
         (COUNT(DISTINCT n.survey_id) FILTER (WHERE n.score >= 9))::int              AS "promoters",
         (COUNT(DISTINCT n.survey_id) FILTER (WHERE n.score BETWEEN 7 AND 8))::int  AS "passives",
         (COUNT(DISTINCT n.survey_id) FILTER (WHERE n.score <= 6))::int              AS "detractors",
         CASE
           WHEN COUNT(DISTINCT n.survey_id) = 0 THEN NULL
           ELSE ROUND(
             (
               (COUNT(DISTINCT n.survey_id) FILTER (WHERE n.score >= 9))::numeric
               - (COUNT(DISTINCT n.survey_id) FILTER (WHERE n.score <= 6))::numeric
             ) / COUNT(DISTINCT n.survey_id)::numeric * 100,
             2
           )
         END                                                                         AS "npsScore"
       FROM nps_surveys n
       JOIN sales s          ON s.sale_id     = n.sale_id
       JOIN sale_details sd  ON sd.sale_id    = s.sale_id
       JOIN products p       ON p.product_id  = sd.product_id
       JOIN categories c     ON c.category_id = p.category_id
      WHERE ($1::timestamptz IS NULL OR n.created_at >= $1)
        AND ($2::timestamptz IS NULL OR n.created_at <= $2)
      GROUP BY p.product_id, p.product_name, c.category_id, c.category_description
      ORDER BY COUNT(DISTINCT n.survey_id) DESC
      LIMIT 20`,
      [from ?? null, to ?? null],
    );

    return rows.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      totalSurveys: r.totalSurveys,
      promoters: r.promoters,
      passives: r.passives,
      detractors: r.detractors,
      npsScore: r.npsScore !== null ? parseFloat(r.npsScore) : null,
    }));
  }

  async getEmailsBySegment(segment: 'promoter' | 'passive' | 'detractor'): Promise<NpsCampaignContact[]> {
    const scoreFilter =
      segment === 'promoter' ? 'n.score >= 9'
      : segment === 'passive' ? 'n.score BETWEEN 7 AND 8'
      : 'n.score <= 6';

    const rows: Array<{ email: string; firstName: string; lastName: string }> =
      await this.dataSource.query(
        `SELECT DISTINCT ON (ue.email)
           ue.email       AS "email",
           ue.first_name  AS "firstName",
           ue.last_name   AS "lastName"
         FROM nps_surveys n
         JOIN sales s ON s.sale_id = n.sale_id
         JOIN users_ecommerce ue ON ue.user_ecommerce_id = s.user_ecommerce_id
         WHERE ${scoreFilter}
           AND ue.user_active = true
         ORDER BY ue.email`,
      );
    return rows;
  }

  async getStats(from?: Date, to?: Date): Promise<NpsStats> {
    const qb = this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'total')
      .addSelect('COUNT(*) FILTER (WHERE score >= 9)', 'promoters')
      .addSelect('COUNT(*) FILTER (WHERE score >= 7 AND score <= 8)', 'passives')
      .addSelect('COUNT(*) FILTER (WHERE score <= 6)', 'detractors')
      .from('nps_surveys', 'n');

    if (from) {
      qb.andWhere('n.created_at >= :from', { from });
    }
    if (to) {
      qb.andWhere('n.created_at <= :to', { to });
    }

    const row = await qb.getRawOne<{
      total: string;
      promoters: string;
      passives: string;
      detractors: string;
    }>();

    return {
      total: parseInt(row?.total ?? '0', 10),
      promoters: parseInt(row?.promoters ?? '0', 10),
      passives: parseInt(row?.passives ?? '0', 10),
      detractors: parseInt(row?.detractors ?? '0', 10),
    };
  }
}
