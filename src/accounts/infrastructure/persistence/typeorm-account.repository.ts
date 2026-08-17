import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../../../shared/domain/pagination';
import { Account, AccountId } from '../../domain/account';
import { AccountRepository } from '../../domain/account.repository';
import { AccountSearchCriteria } from '../../domain/account-search.criteria';
import { AccountMapper } from './account.mapper';
import { AccountOrmEntity } from './account.orm-entity';

@Injectable()
export class TypeOrmAccountRepository implements AccountRepository {
  constructor(
    @InjectRepository(AccountOrmEntity)
    private readonly repo: Repository<AccountOrmEntity>,
  ) {}

  async findById(id: AccountId): Promise<Account | null> {
    const row = await this.repo.findOne({ where: { accountId: id.value } });
    return row ? AccountMapper.toDomain(row) : null;
  }

  async findByCode(code: string, excludeId?: AccountId): Promise<Account | null> {
    const qb = this.repo
      .createQueryBuilder('a')
      .where('a.code = :code', { code });

    if (excludeId) {
      qb.andWhere('a.accountId <> :excluido', { excluido: excludeId.value });
    }

    const row = await qb.getOne();
    return row ? AccountMapper.toDomain(row) : null;
  }

  async search(criteria: AccountSearchCriteria): Promise<Page<Account>> {
    const qb = this.repo.createQueryBuilder('a');

    if (criteria.code) {
      qb.andWhere('a.code ILIKE :code', { code: `%${criteria.code}%` });
    }

    if (criteria.name) {
      qb.andWhere('a.name ILIKE :name', { name: `%${criteria.name}%` });
    }

    if (criteria.type) {
      qb.andWhere('a.type = :type', { type: criteria.type });
    }

    if (criteria.parentCode !== undefined && criteria.parentCode !== null) {
      qb.andWhere('a.parentCode = :parentCode', { parentCode: criteria.parentCode });
    }

    if (criteria.active !== null) {
      qb.andWhere('a.active = :activo', { activo: criteria.active });
    }

    qb.orderBy('a.code', criteria.sortDirection)
      .addOrderBy('a.accountId', 'ASC')
      .skip(criteria.page.offset)
      .take(criteria.page.limit);

    const [rows, total] = await qb.getManyAndCount();

    return new Page(
      rows.map((row) => AccountMapper.toDomain(row)),
      total,
      criteria.page.page,
      criteria.page.limit,
    );
  }

  async insert(account: Account): Promise<void> {
    await this.repo.insert(AccountMapper.toPersistence(account));
  }

  async update(account: Account): Promise<void> {
    await this.repo.save(AccountMapper.toPersistence(account));
  }

  async softDelete(id: AccountId): Promise<void> {
    await this.repo.softDelete({ accountId: id.value });
  }
}
