import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Page } from '../../../shared/domain/pagination';
import { ProductOrmEntity } from '../../../products/infrastructure/persistence/product.orm-entity';
import { SupplierOrmEntity } from '../../../suppliers/infrastructure/persistence/supplier.orm-entity';
import { PurchaseOrder } from '../../domain/purchase-order';
import { PurchaseOrderSearchCriteria, PurchaseOrderSummary } from '../../domain/purchase-order.repository';
import type { PurchaseOrderCatalog, PurchaseOrderRepository } from '../../domain/purchase-order.repository';
import { PurchaseOrderId } from '../../domain/value-objects/purchase-order-id.value-object';
import { PurchaseOrderMapper } from './purchase-order.mapper';
import {
  PurchaseOrderDetailOrmEntity,
  PurchaseOrderOrmEntity,
} from './purchase-order.orm-entity';

@Injectable()
export class TypeOrmPurchaseOrderRepository
  implements PurchaseOrderRepository, PurchaseOrderCatalog
{
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PurchaseOrderOrmEntity)
    private readonly orders: Repository<PurchaseOrderOrmEntity>,
    @InjectRepository(PurchaseOrderDetailOrmEntity)
    private readonly detalles: Repository<PurchaseOrderDetailOrmEntity>,
    @InjectRepository(SupplierOrmEntity)
    private readonly suppliers: Repository<SupplierOrmEntity>,
    @InjectRepository(ProductOrmEntity)
    private readonly products: Repository<ProductOrmEntity>,
  ) {}

  async findById(id: PurchaseOrderId): Promise<PurchaseOrder | null> {
    const row = await this.orders.findOne({ where: { purchaseOrderId: id.value } });
    if (!row) return null;
    const detalles = await this.detalles.find({ where: { purchaseOrderId: id.value } });
    return PurchaseOrderMapper.toDomain(row, detalles);
  }

  async search(criteria: PurchaseOrderSearchCriteria): Promise<Page<PurchaseOrderSummary>> {
    const qb = this.orders.createQueryBuilder('o');

    if (criteria.supplierId) {
      qb.andWhere('o.supplierId = :supplierId', { supplierId: criteria.supplierId });
    }
    if (criteria.status) {
      qb.andWhere('o.purchaseOrderStatus = :status', { status: criteria.status });
    }
    if (criteria.dateFrom) {
      qb.andWhere('o.purchaseOrderDate >= :desde', { desde: criteria.dateFrom });
    }
    if (criteria.dateTo) {
      qb.andWhere('o.purchaseOrderDate <= :hasta', { hasta: criteria.dateTo });
    }

    qb.orderBy('o.purchaseOrderDate', 'DESC')
      .addOrderBy('o.purchaseOrderId', 'ASC')
      .skip(criteria.page.offset)
      .take(criteria.page.limit);

    const [rows, total] = await qb.getManyAndCount();
    const conteos = await this.contarLineas(rows.map((r) => r.purchaseOrderId));

    return new Page(
      rows.map((row) =>
        PurchaseOrderMapper.toSummary(
          Object.assign(row, { lineCount: String(conteos.get(row.purchaseOrderId) ?? 0) }),
        ),
      ),
      total,
      criteria.page.page,
      criteria.page.limit,
    );
  }

  private async contarLineas(ids: string[]): Promise<Map<string, number>> {
    if (ids.length === 0) return new Map();
    const filas = await this.detalles
      .createQueryBuilder('d')
      .select('d.purchaseOrderId', 'purchaseOrderId')
      .addSelect('count(*)', 'n')
      .where('d.purchaseOrderId IN (:...ids)', { ids })
      .groupBy('d.purchaseOrderId')
      .getRawMany<{ purchaseOrderId: string; n: string }>();
    return new Map(filas.map((f) => [f.purchaseOrderId, Number(f.n)]));
  }

  async insert(order: PurchaseOrder): Promise<void> {
    const { cabecera, lineas } = PurchaseOrderMapper.toPersistence(order);
    await this.dataSource.transaction(async (manager: EntityManager) => {
      await manager.insert(PurchaseOrderOrmEntity, cabecera);
      await manager.insert(PurchaseOrderDetailOrmEntity, lineas);
    });
  }

  async update(order: PurchaseOrder): Promise<void> {
    const { cabecera } = PurchaseOrderMapper.toPersistence(order);
    await this.orders.update(
      { purchaseOrderId: cabecera.purchaseOrderId },
      {
        purchaseOrderStatus: cabecera.purchaseOrderStatus,
        notes: cabecera.notes,
      },
    );
  }

  // --- PurchaseOrderCatalog ---

  async supplierExists(supplierId: string): Promise<boolean> {
    const count = await this.suppliers.count({ where: { supplierId } });
    return count > 0;
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
