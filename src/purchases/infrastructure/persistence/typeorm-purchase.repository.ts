import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { ProductOrmEntity } from '../../../products/infrastructure/persistence/product.orm-entity';
import { Page } from '../../../shared/domain/pagination';
import { SupplierOrmEntity } from '../../../suppliers/infrastructure/persistence/supplier.orm-entity';
import { Purchase } from '../../domain/purchase';
import { PurchaseSearchCriteria } from '../../domain/purchase-search.criteria';
import type {
  PurchaseCatalog,
  PurchaseRepository,
  PurchaseSummary,
} from '../../domain/purchase.repository';
import { PurchaseId } from '../../domain/value-objects/purchase-id.value-object';
import { PurchaseMapper } from './purchase.mapper';
import {
  PurchaseDetailOrmEntity,
  PurchaseOrmEntity,
} from './purchase.orm-entity';

/**
 * Adaptador de salida: implementa el puerto PurchaseRepository y PurchaseCatalog
 * con TypeORM. El mismo adaptador satisface los dos, igual que en ventas.
 */
@Injectable()
export class TypeOrmPurchaseRepository
  implements PurchaseRepository, PurchaseCatalog
{
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PurchaseOrmEntity)
    private readonly purchases: Repository<PurchaseOrmEntity>,
    @InjectRepository(PurchaseDetailOrmEntity)
    private readonly detalles: Repository<PurchaseDetailOrmEntity>,
    @InjectRepository(SupplierOrmEntity)
    private readonly suppliers: Repository<SupplierOrmEntity>,
    @InjectRepository(ProductOrmEntity)
    private readonly products: Repository<ProductOrmEntity>,
  ) {}

  async findById(id: PurchaseId): Promise<Purchase | null> {
    const row = await this.purchases.findOne({
      where: { purchaseId: id.value },
    });
    if (!row) return null;
    const detalles = await this.detalles.find({
      where: { purchaseId: id.value },
    });
    return PurchaseMapper.toDomain(row, detalles);
  }

  async search(
    criteria: PurchaseSearchCriteria,
  ): Promise<Page<PurchaseSummary>> {
    const qb = this.purchases.createQueryBuilder('p');
    this.aplicarFiltros(qb, criteria);

    const columna = criteria.sortBy === 'total' ? 'p.total' : 'p.purchaseDate';

    qb.orderBy(columna, criteria.sortDirection)
      // Desempate por clave primaria: sin esto, las compras del mismo dia pueden
      // alternar de pagina entre consultas y el paginado repite o saltea filas.
      .addOrderBy('p.purchaseId', 'ASC')
      .skip(criteria.page.offset)
      .take(criteria.page.limit);

    const [rows, total] = await qb.getManyAndCount();

    // El conteo de lineas se resuelve en una sola consulta para las compras de
    // esta pagina, no una por compra.
    const conteos = await this.contarLineas(rows.map((r) => r.purchaseId));

    return new Page(
      rows.map((row) =>
        PurchaseMapper.toSummary(
          Object.assign(row, {
            lineCount: String(conteos.get(row.purchaseId) ?? 0),
          }),
        ),
      ),
      total,
      criteria.page.page,
      criteria.page.limit,
    );
  }

  private async contarLineas(
    purchaseIds: string[],
  ): Promise<Map<string, number>> {
    if (purchaseIds.length === 0) return new Map();
    const filas = await this.detalles
      .createQueryBuilder('d')
      .select('d.purchaseId', 'purchaseId')
      .addSelect('count(*)', 'n')
      .where('d.purchaseId IN (:...ids)', { ids: purchaseIds })
      .groupBy('d.purchaseId')
      .getRawMany<{ purchaseId: string; n: string }>();
    return new Map(filas.map((f) => [f.purchaseId, Number(f.n)]));
  }

  private aplicarFiltros(
    qb: SelectQueryBuilder<PurchaseOrmEntity>,
    criteria: PurchaseSearchCriteria,
  ): void {
    if (criteria.supplierId) {
      qb.andWhere('p.supplierId = :supplierId', {
        supplierId: criteria.supplierId.value,
      });
    }

    if (criteria.dates.from) {
      qb.andWhere('p.purchaseDate >= :desde', { desde: criteria.dates.from });
    }
    if (criteria.dates.to) {
      qb.andWhere('p.purchaseDate <= :hasta', { hasta: criteria.dates.to });
    }

    if (criteria.totals.min) {
      qb.andWhere('p.total >= :totalMin', {
        totalMin: criteria.totals.min.toDecimalString(),
      });
    }
    if (criteria.totals.max) {
      qb.andWhere('p.total <= :totalMax', {
        totalMax: criteria.totals.max.toDecimalString(),
      });
    }
  }

  /**
   * Guarda la cabecera y sus lineas en una sola transaccion. Sin correlativo que
   * reservar: la compra no lleva numero de comprobante.
   */
  async insert(purchase: Purchase): Promise<void> {
    const { cabecera, lineas } = PurchaseMapper.toPersistence(purchase);

    await this.dataSource.transaction(async (manager: EntityManager) => {
      await manager.insert(PurchaseOrmEntity, cabecera);
      await manager.insert(PurchaseDetailOrmEntity, lineas);
    });
  }

  /**
   * Actualiza la cabecera y reemplaza las lineas.
   *
   * Las lineas se borran y reinsertan en vez de compararse una por una: el item
   * es parte de la clave primaria, asi que reordenar productos cambiaria las
   * claves y un `save` dejaria filas viejas conviviendo con las nuevas.
   */
  async update(purchase: Purchase): Promise<void> {
    const { cabecera, lineas } = PurchaseMapper.toPersistence(purchase);

    await this.dataSource.transaction(async (manager: EntityManager) => {
      await manager.update(
        PurchaseOrmEntity,
        { purchaseId: cabecera.purchaseId },
        cabecera,
      );
      await manager.delete(PurchaseDetailOrmEntity, {
        purchaseId: cabecera.purchaseId,
      });
      await manager.insert(PurchaseDetailOrmEntity, lineas);
    });
  }

  // --- PurchaseCatalog -----------------------------------------------------

  async supplierState(supplierId: string): Promise<{ active: boolean } | null> {
    const row = await this.suppliers.findOne({
      where: { supplierId },
      select: { supplierId: true, supplierActive: true },
    });
    return row ? { active: row.supplierActive } : null;
  }

  async productsExist(productIds: readonly string[]): Promise<Set<string>> {
    if (productIds.length === 0) return new Set();

    const filas = await this.products.find({
      where: { productId: In([...productIds]) },
      select: { productId: true },
    });

    return new Set(filas.map((f) => f.productId));
  }
}
