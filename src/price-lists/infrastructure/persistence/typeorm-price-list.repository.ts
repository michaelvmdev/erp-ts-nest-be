import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../../../shared/domain/pagination';
import { PriceList, PriceListItemSnapshot } from '../../domain/price-list';
import { PriceListSearchCriteria } from '../../domain/price-list-search.criteria';
import { ProductNotInCatalogError } from '../../domain/price-list.errors';
import { PriceListRepository } from '../../domain/price-list.repository';
import { PriceListId } from '../../domain/value-objects/price-list-id.value-object';
import { PriceListName } from '../../domain/value-objects/price-list-name.value-object';
import { PriceListMapper } from './price-list.mapper';
import { PriceListItemOrmEntity } from './price-list-item.orm-entity';
import { PriceListOrmEntity } from './price-list.orm-entity';

const PG_FOREIGN_KEY_VIOLATION = '23503';

function isFkViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === PG_FOREIGN_KEY_VIOLATION
  );
}

@Injectable()
export class TypeOrmPriceListRepository implements PriceListRepository {
  constructor(
    @InjectRepository(PriceListOrmEntity)
    private readonly repo: Repository<PriceListOrmEntity>,
    @InjectRepository(PriceListItemOrmEntity)
    private readonly itemRepo: Repository<PriceListItemOrmEntity>,
  ) {}

  async findById(id: PriceListId): Promise<PriceList | null> {
    const row = await this.repo.findOne({ where: { priceListId: id.value } });
    if (!row) return null;

    const items = await this.itemRepo.find({ where: { priceListId: id.value } });
    return PriceListMapper.toDomain(row, items);
  }

  async findByName(name: PriceListName, excludeId?: PriceListId): Promise<PriceList | null> {
    const qb = this.repo
      .createQueryBuilder('pl')
      .where('LOWER(TRIM(pl.priceListName)) = :clave', { clave: name.comparisonKey });

    if (excludeId) {
      qb.andWhere('pl.priceListId <> :excluido', { excluido: excludeId.value });
    }

    const row = await qb.getOne();
    return row ? PriceListMapper.toDomain(row) : null;
  }

  async search(criteria: PriceListSearchCriteria): Promise<Page<PriceList>> {
    const qb = this.repo.createQueryBuilder('pl');

    if (criteria.name) {
      qb.andWhere('pl.priceListName ILIKE :nombre', { nombre: `%${criteria.name}%` });
    }

    if (criteria.active !== null) {
      qb.andWhere('pl.priceListActive = :activo', { activo: criteria.active });
    }

    qb.orderBy('pl.priceListName', criteria.sortDirection)
      .addOrderBy('pl.priceListId', 'ASC')
      .skip(criteria.page.offset)
      .take(criteria.page.limit);

    const [rows, total] = await qb.getManyAndCount();

    return new Page(
      // En el listado no se cargan items (rendimiento)
      rows.map((row) => PriceListMapper.toDomain(row, [])),
      total,
      criteria.page.page,
      criteria.page.limit,
    );
  }

  async insert(priceList: PriceList): Promise<void> {
    await this.repo.insert(PriceListMapper.toPersistenceMeta(priceList));
  }

  async updateMeta(priceList: PriceList): Promise<void> {
    await this.repo.save(PriceListMapper.toPersistenceMeta(priceList));
  }

  async replaceItems(id: PriceListId, items: readonly PriceListItemSnapshot[]): Promise<void> {
    await this.itemRepo.delete({ priceListId: id.value });

    if (items.length === 0) return;

    const rows = items.map((i) =>
      PriceListMapper.itemToPersistence(id.value, i.productId, i.unitPrice),
    );

    try {
      await this.itemRepo.insert(rows);
    } catch (error) {
      if (isFkViolation(error)) {
        throw new ProductNotInCatalogError('uno o mas productos no existen en el catalogo');
      }
      throw error;
    }
  }
}
