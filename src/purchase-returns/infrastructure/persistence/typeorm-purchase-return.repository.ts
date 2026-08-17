import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Money } from '../../../shared/domain/money.value-object';
import { Page } from '../../../shared/domain/pagination';
import {
  PurchaseDetailOrmEntity,
  PurchaseOrmEntity,
} from '../../../purchases/infrastructure/persistence/purchase.orm-entity';
import { PurchaseReturn } from '../../domain/purchase-return';
import type {
  PurchaseReturnCatalog,
  PurchaseReturnRepository,
} from '../../domain/purchase-return.repository';
import { PurchaseReturnSearchCriteria, PurchaseReturnSummary } from '../../domain/purchase-return.repository';
import { PurchaseReturnId } from '../../domain/value-objects/purchase-return-id.value-object';
import { PurchaseReturnMapper } from './purchase-return.mapper';
import {
  PurchaseReturnDetailOrmEntity,
  PurchaseReturnOrmEntity,
} from './purchase-return.orm-entity';

@Injectable()
export class TypeOrmPurchaseReturnRepository
  implements PurchaseReturnRepository, PurchaseReturnCatalog
{
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(PurchaseReturnOrmEntity)
    private readonly purchaseReturns: Repository<PurchaseReturnOrmEntity>,
    @InjectRepository(PurchaseReturnDetailOrmEntity)
    private readonly detalles: Repository<PurchaseReturnDetailOrmEntity>,
    @InjectRepository(PurchaseOrmEntity)
    private readonly purchases: Repository<PurchaseOrmEntity>,
    @InjectRepository(PurchaseDetailOrmEntity)
    private readonly purchaseDetails: Repository<PurchaseDetailOrmEntity>,
  ) {}

  async findById(id: PurchaseReturnId): Promise<PurchaseReturn | null> {
    const row = await this.purchaseReturns.findOne({
      where: { purchaseReturnId: id.value },
    });
    if (!row) return null;
    const details = await this.detalles.find({ where: { purchaseReturnId: id.value } });
    return PurchaseReturnMapper.toDomain(row, details);
  }

  async search(criteria: PurchaseReturnSearchCriteria): Promise<Page<PurchaseReturnSummary>> {
    const qb = this.purchaseReturns.createQueryBuilder('pr');

    if (criteria.purchaseId) {
      qb.andWhere('pr.purchaseId = :purchaseId', { purchaseId: criteria.purchaseId });
    }
    if (criteria.dateFrom) {
      qb.andWhere('pr.returnDate >= :desde', { desde: criteria.dateFrom });
    }
    if (criteria.dateTo) {
      qb.andWhere('pr.returnDate <= :hasta', { hasta: criteria.dateTo });
    }

    qb.orderBy('pr.returnDate', 'DESC')
      .addOrderBy('pr.purchaseReturnId', 'ASC')
      .skip(criteria.page.offset)
      .take(criteria.page.limit);

    const [rows, total] = await qb.getManyAndCount();
    const conteos = await this.contarLineas(rows.map((r) => r.purchaseReturnId));

    return new Page(
      rows.map((row) =>
        PurchaseReturnMapper.toSummary(
          Object.assign(row, { lineCount: String(conteos.get(row.purchaseReturnId) ?? 0) }),
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
      .select('d.purchaseReturnId', 'purchaseReturnId')
      .addSelect('count(*)', 'n')
      .where('d.purchaseReturnId IN (:...ids)', { ids })
      .groupBy('d.purchaseReturnId')
      .getRawMany<{ purchaseReturnId: string; n: string }>();
    return new Map(filas.map((f) => [f.purchaseReturnId, Number(f.n)]));
  }

  async emit(
    purchaseId: string,
    armar: (numero: string) => PurchaseReturn,
  ): Promise<PurchaseReturn> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const [{ correlativo }] = await manager.query<{ correlativo: string }[]>(
        `SELECT lpad(nextval('seq_purchase_return_number')::text, 10, '0') AS correlativo`,
      );
      const numero = `DPC-${correlativo}`;
      const pr = armar(numero);
      const { cabecera, lineas } = PurchaseReturnMapper.toPersistence(pr);
      await manager.insert(PurchaseReturnOrmEntity, cabecera);
      await manager.insert(PurchaseReturnDetailOrmEntity, lineas);
      return pr;
    });
  }

  // --- PurchaseReturnCatalog ---

  async purchaseExists(purchaseId: string): Promise<boolean> {
    const count = await this.purchases.count({ where: { purchaseId } });
    return count > 0;
  }

  async purchaseLinesMap(purchaseId: string): Promise<Map<string, { unitCost: Money }>> {
    const details = await this.purchaseDetails.find({ where: { purchaseId } });
    return new Map(
      details.map((d) => [d.productId, { unitCost: Money.fromDecimalString(d.unitPrice) }]),
    );
  }
}
