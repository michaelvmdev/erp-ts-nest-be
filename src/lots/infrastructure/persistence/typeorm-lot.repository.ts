import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductOrmEntity } from '../../../products/infrastructure/persistence/product.orm-entity';
import { WarehouseOrmEntity } from '../../../warehouses/infrastructure/persistence/warehouse.orm-entity';
import { Page } from '../../../shared/domain/pagination';
import { Lot } from '../../domain/lot';
import type { LotRepository, LotSearchCriteria, LotSummary } from '../../domain/lot.repository';
import { LotId } from '../../domain/value-objects/lot-id.value-object';
import { LotMapper } from './lot.mapper';
import { LotOrmEntity } from './lot.orm-entity';

@Injectable()
export class TypeOrmLotRepository implements LotRepository {
  constructor(
    @InjectRepository(LotOrmEntity)
    private readonly lotsRepo: Repository<LotOrmEntity>,
    @InjectRepository(ProductOrmEntity)
    private readonly productsRepo: Repository<ProductOrmEntity>,
    @InjectRepository(WarehouseOrmEntity)
    private readonly warehousesRepo: Repository<WarehouseOrmEntity>,
  ) {}

  async findById(id: LotId): Promise<Lot | null> {
    const row = await this.lotsRepo.findOne({ where: { lotId: id.value } });
    return row ? LotMapper.toDomain(row) : null;
  }

  async search(criteria: LotSearchCriteria): Promise<Page<LotSummary>> {
    const page  = criteria.page  ?? 1;
    const limit = criteria.limit ?? 20;

    const qb = this.lotsRepo.createQueryBuilder('l');

    if (criteria.productId) {
      qb.andWhere('l.productId = :productId', { productId: criteria.productId });
    }
    if (criteria.warehouseId) {
      qb.andWhere('l.warehouseId = :warehouseId', { warehouseId: criteria.warehouseId });
    }
    if (criteria.status) {
      qb.andWhere('l.status = :status', { status: criteria.status });
    }
    if (criteria.expiringBeforeDate) {
      qb.andWhere('l.expirationDate <= :before', { before: criteria.expiringBeforeDate });
    }

    qb.orderBy('l.expirationDate', 'ASC').addOrderBy('l.lotId', 'ASC');
    qb.skip((page - 1) * limit).take(limit);

    const [rows, total] = await qb.getManyAndCount();

    const productIds  = [...new Set(rows.map((r) => r.productId))];
    const warehouseIds = [...new Set(rows.map((r) => r.warehouseId))];

    const [products, warehouses] = await Promise.all([
      productIds.length
        ? this.productsRepo.createQueryBuilder('p')
            .select(['p.productId', 'p.productName'])
            .where('p.productId IN (:...ids)', { ids: productIds })
            .getMany()
        : Promise.resolve([]),
      warehouseIds.length
        ? this.warehousesRepo.createQueryBuilder('w')
            .select(['w.warehouseId', 'w.warehouseCode'])
            .where('w.warehouseId IN (:...ids)', { ids: warehouseIds })
            .getMany()
        : Promise.resolve([]),
    ]);

    const productMap  = new Map(products.map((p) => [p.productId, p.productName]));
    const warehouseMap = new Map(warehouses.map((w) => [w.warehouseId, w.warehouseCode]));

    return new Page(
      rows.map((row) =>
        LotMapper.toSummary(
          Object.assign(row, {
            productName:   productMap.get(row.productId)   ?? '',
            warehouseCode: warehouseMap.get(row.warehouseId) ?? '',
          }),
        ),
      ),
      total,
      page,
      limit,
    );
  }

  async save(lot: Lot): Promise<void> {
    await this.lotsRepo.save(LotMapper.toPersistence(lot));
  }
}
