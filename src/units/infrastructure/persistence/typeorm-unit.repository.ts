import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../../../shared/domain/pagination';
import { Unit } from '../../domain/unit';
import { UnitSearchCriteria } from '../../domain/unit-search.criteria';
import { UnitRepository } from '../../domain/unit.repository';
import { UnitCode } from '../../domain/value-objects/unit-code.value-object';
import { UnitId } from '../../domain/value-objects/unit-id.value-object';
import { UnitMapper } from './unit.mapper';
import { UnitOrmEntity } from './unit.orm-entity';

@Injectable()
export class TypeOrmUnitRepository implements UnitRepository {
  constructor(
    @InjectRepository(UnitOrmEntity)
    private readonly repo: Repository<UnitOrmEntity>,
  ) {}

  async findById(id: UnitId): Promise<Unit | null> {
    const row = await this.repo.findOne({ where: { unitId: id.value } });
    return row ? UnitMapper.toDomain(row) : null;
  }

  async findByCode(code: UnitCode, excludeId?: UnitId): Promise<Unit | null> {
    const qb = this.repo
      .createQueryBuilder('u')
      .where('UPPER(TRIM(u.unitCode)) = :codigo', { codigo: code.comparisonKey });

    if (excludeId) {
      qb.andWhere('u.unitId <> :excluido', { excluido: excludeId.value });
    }

    const row = await qb.getOne();
    return row ? UnitMapper.toDomain(row) : null;
  }

  async search(criteria: UnitSearchCriteria): Promise<Page<Unit>> {
    const qb = this.repo.createQueryBuilder('u');

    if (criteria.code) {
      qb.andWhere('u.unitCode ILIKE :codigo', { codigo: `%${criteria.code}%` });
    }

    if (criteria.description) {
      qb.andWhere('u.unitDescription ILIKE :descripcion', {
        descripcion: `%${criteria.description}%`,
      });
    }

    if (criteria.active !== null) {
      qb.andWhere('u.unitActive = :activo', { activo: criteria.active });
    }

    qb.orderBy('u.unitCode', criteria.sortDirection)
      .addOrderBy('u.unitId', 'ASC')
      .skip(criteria.page.offset)
      .take(criteria.page.limit);

    const [rows, total] = await qb.getManyAndCount();

    return new Page(
      rows.map((row) => UnitMapper.toDomain(row)),
      total,
      criteria.page.page,
      criteria.page.limit,
    );
  }

  async insert(unit: Unit): Promise<void> {
    await this.repo.insert(UnitMapper.toPersistence(unit));
  }

  async update(unit: Unit): Promise<void> {
    await this.repo.save(UnitMapper.toPersistence(unit));
  }
}
