import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../../../shared/domain/pagination';
import { Warehouse } from '../../domain/warehouse';
import { WarehouseSearchCriteria } from '../../domain/warehouse-search.criteria';
import { WarehouseRepository } from '../../domain/warehouse.repository';
import { WarehouseCode } from '../../domain/value-objects/warehouse-code.value-object';
import { WarehouseId } from '../../domain/value-objects/warehouse-id.value-object';
import { WarehouseMapper } from './warehouse.mapper';
import { WarehouseOrmEntity } from './warehouse.orm-entity';

@Injectable()
export class TypeOrmWarehouseRepository implements WarehouseRepository {
  constructor(
    @InjectRepository(WarehouseOrmEntity)
    private readonly repo: Repository<WarehouseOrmEntity>,
  ) {}

  async findById(id: WarehouseId): Promise<Warehouse | null> {
    const row = await this.repo.findOne({ where: { warehouseId: id.value } });
    return row ? WarehouseMapper.toDomain(row) : null;
  }

  async findByCode(code: WarehouseCode, excludeId?: WarehouseId): Promise<Warehouse | null> {
    const qb = this.repo
      .createQueryBuilder('w')
      .where('UPPER(TRIM(w.warehouseCode)) = :codigo', { codigo: code.comparisonKey });

    if (excludeId) {
      qb.andWhere('w.warehouseId <> :excluido', { excluido: excludeId.value });
    }

    const row = await qb.getOne();
    return row ? WarehouseMapper.toDomain(row) : null;
  }

  async search(criteria: WarehouseSearchCriteria): Promise<Page<Warehouse>> {
    const qb = this.repo.createQueryBuilder('w');

    if (criteria.code) {
      qb.andWhere('w.warehouseCode ILIKE :codigo', { codigo: `%${criteria.code}%` });
    }

    if (criteria.description) {
      qb.andWhere('w.warehouseDescription ILIKE :descripcion', {
        descripcion: `%${criteria.description}%`,
      });
    }

    if (criteria.active !== null) {
      qb.andWhere('w.warehouseActive = :activo', { activo: criteria.active });
    }

    qb.orderBy('w.warehouseCode', criteria.sortDirection)
      .addOrderBy('w.warehouseId', 'ASC')
      .skip(criteria.page.offset)
      .take(criteria.page.limit);

    const [rows, total] = await qb.getManyAndCount();

    return new Page(
      rows.map((row) => WarehouseMapper.toDomain(row)),
      total,
      criteria.page.page,
      criteria.page.limit,
    );
  }

  async insert(warehouse: Warehouse): Promise<void> {
    await this.repo.insert(WarehouseMapper.toPersistence(warehouse));
  }

  async update(warehouse: Warehouse): Promise<void> {
    await this.repo.save(WarehouseMapper.toPersistence(warehouse));
  }
}
