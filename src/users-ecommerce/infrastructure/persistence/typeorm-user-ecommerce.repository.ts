import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Page } from '../../../shared/domain/pagination';
import { UserEcommerce } from '../../domain/user-ecommerce';
import { UserEcommerceSearchCriteria } from '../../domain/user-ecommerce-search.criteria';
import { UserEcommerceInUseError } from '../../domain/user-ecommerce.errors';
import { UserEcommerceRepository, UserPurchaseHistoryItem } from '../../domain/user-ecommerce.repository';
import { UserEcommerceId } from '../../domain/value-objects/user-ecommerce-id.value-object';
import { UserEcommerceMapper } from './user-ecommerce.mapper';
import { UserEcommerceOrmEntity } from './user-ecommerce.orm-entity';

const PG_FOREIGN_KEY_VIOLATION = '23503';

function isPgError(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === code
  );
}

@Injectable()
export class TypeOrmUserEcommerceRepository implements UserEcommerceRepository {
  constructor(
    @InjectRepository(UserEcommerceOrmEntity)
    private readonly repo: Repository<UserEcommerceOrmEntity>,
    @InjectDataSource()
    private readonly ds: DataSource,
  ) {}

  async findById(id: UserEcommerceId): Promise<UserEcommerce | null> {
    const row = await this.repo.findOne({ where: { userEcommerceId: id.value } });
    return row ? UserEcommerceMapper.toDomain(row) : null;
  }

  async findByEmail(email: string, excludeId?: UserEcommerceId): Promise<UserEcommerce | null> {
    const qb = this.repo.createQueryBuilder('u').where('u.email = :email', { email });
    if (excludeId) {
      qb.andWhere('u.userEcommerceId <> :excludeId', { excludeId: excludeId.value });
    }
    const row = await qb.getOne();
    return row ? UserEcommerceMapper.toDomain(row) : null;
  }

  async search(criteria: UserEcommerceSearchCriteria): Promise<Page<UserEcommerce>> {
    const qb = this.repo.createQueryBuilder('u');

    if (criteria.email) {
      qb.andWhere('u.email ILIKE :email', { email: `%${criteria.email}%` });
    }
    if (criteria.firstName) {
      qb.andWhere('u.firstName ILIKE :firstName', { firstName: `%${criteria.firstName}%` });
    }
    if (criteria.lastName) {
      qb.andWhere('u.lastName ILIKE :lastName', { lastName: `%${criteria.lastName}%` });
    }
    if (criteria.active !== null) {
      qb.andWhere('u.userActive = :active', { active: criteria.active });
    }

    const col: Record<typeof criteria.sortBy, string> = {
      email: 'u.email',
      firstName: 'u.firstName',
      lastName: 'u.lastName',
      createdAt: 'u.createdAt',
    };

    qb.orderBy(col[criteria.sortBy], criteria.sortDirection)
      .addOrderBy('u.userEcommerceId', 'ASC')
      .skip(criteria.page.offset)
      .take(criteria.page.limit);

    const [rows, total] = await qb.getManyAndCount();

    return new Page(
      rows.map((r) => UserEcommerceMapper.toDomain(r)),
      total,
      criteria.page.page,
      criteria.page.limit,
    );
  }

  async insert(user: UserEcommerce): Promise<void> {
    await this.repo.insert(UserEcommerceMapper.toPersistence(user));
  }

  async update(user: UserEcommerce): Promise<void> {
    await this.repo.save(UserEcommerceMapper.toPersistence(user));
  }

  async delete(id: UserEcommerceId): Promise<void> {
    try {
      await this.repo.delete({ userEcommerceId: id.value });
    } catch (error) {
      if (isPgError(error, PG_FOREIGN_KEY_VIOLATION)) {
        throw new UserEcommerceInUseError(id.value);
      }
      throw error;
    }
  }

  async getPurchaseHistory(id: string): Promise<UserPurchaseHistoryItem[]> {
    const rows: Array<{
      saleId: string; saleDate: string; serie: string; number: string;
      total: string; saleStatus: string; npsScore: string | null; npsCategory: string | null;
    }> = await this.ds.query(
      `SELECT
         s.sale_id        AS "saleId",
         TO_CHAR(s.sale_date, 'YYYY-MM-DD') AS "saleDate",
         s.serie, s.number,
         s.total::text    AS "total",
         s.sale_status    AS "saleStatus",
         n.score::text    AS "npsScore",
         n.category       AS "npsCategory"
       FROM sales s
       LEFT JOIN nps_surveys n ON n.sale_id = s.sale_id
       WHERE s.user_ecommerce_id = $1
       ORDER BY s.sale_date DESC`,
      [id],
    );

    return rows.map((r) => ({
      saleId:      r.saleId,
      saleDate:    r.saleDate,
      serie:       r.serie,
      number:      r.number,
      total:       r.total,
      saleStatus:  r.saleStatus,
      npsScore:    r.npsScore !== null ? Number(r.npsScore) : null,
      npsCategory: r.npsCategory as UserPurchaseHistoryItem['npsCategory'],
    }));
  }
}
