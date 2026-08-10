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
import { NpsSurveyRepository, NpsStats } from '../../domain/nps-survey.repository';
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
