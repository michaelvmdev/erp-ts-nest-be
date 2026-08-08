import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Money } from '../../../shared/domain/money.value-object';
import { Page } from '../../../shared/domain/pagination';
import { SaleDetailOrmEntity } from '../../../sales/infrastructure/persistence/sale.orm-entity';
import { SaleOrmEntity } from '../../../sales/infrastructure/persistence/sale.orm-entity';
import { CreditNote } from '../../domain/credit-note';
import { CreditNoteSearchCriteria, CreditNoteSummary } from '../../domain/credit-note.repository';
import type { CreditNoteCatalog, CreditNoteRepository } from '../../domain/credit-note.repository';
import { CreditNoteId } from '../../domain/value-objects/credit-note-id.value-object';
import { CreditNoteMapper } from './credit-note.mapper';
import {
  CreditNoteDetailOrmEntity,
  CreditNoteOrmEntity,
} from './credit-note.orm-entity';

@Injectable()
export class TypeOrmCreditNoteRepository
  implements CreditNoteRepository, CreditNoteCatalog
{
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(CreditNoteOrmEntity)
    private readonly creditNotes: Repository<CreditNoteOrmEntity>,
    @InjectRepository(CreditNoteDetailOrmEntity)
    private readonly detalles: Repository<CreditNoteDetailOrmEntity>,
    @InjectRepository(SaleOrmEntity)
    private readonly sales: Repository<SaleOrmEntity>,
    @InjectRepository(SaleDetailOrmEntity)
    private readonly saleDetails: Repository<SaleDetailOrmEntity>,
  ) {}

  async findById(id: CreditNoteId): Promise<CreditNote | null> {
    const row = await this.creditNotes.findOne({ where: { creditNoteId: id.value } });
    if (!row) return null;
    const detalles = await this.detalles.find({ where: { creditNoteId: id.value } });
    return CreditNoteMapper.toDomain(row, detalles);
  }

  async search(criteria: CreditNoteSearchCriteria): Promise<Page<CreditNoteSummary>> {
    const qb = this.creditNotes.createQueryBuilder('cn');

    if (criteria.saleId) {
      qb.andWhere('cn.saleId = :saleId', { saleId: criteria.saleId });
    }
    if (criteria.dateFrom) {
      qb.andWhere('cn.creditNoteDate >= :desde', { desde: criteria.dateFrom });
    }
    if (criteria.dateTo) {
      qb.andWhere('cn.creditNoteDate <= :hasta', { hasta: criteria.dateTo });
    }

    qb.orderBy('cn.creditNoteDate', 'DESC')
      .addOrderBy('cn.creditNoteId', 'ASC')
      .skip(criteria.page.offset)
      .take(criteria.page.limit);

    const [rows, total] = await qb.getManyAndCount();
    const conteos = await this.contarLineas(rows.map((r) => r.creditNoteId));

    return new Page(
      rows.map((row) =>
        CreditNoteMapper.toSummary(
          Object.assign(row, { lineCount: String(conteos.get(row.creditNoteId) ?? 0) }),
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
      .select('d.creditNoteId', 'creditNoteId')
      .addSelect('count(*)', 'n')
      .where('d.creditNoteId IN (:...ids)', { ids })
      .groupBy('d.creditNoteId')
      .getRawMany<{ creditNoteId: string; n: string }>();
    return new Map(filas.map((f) => [f.creditNoteId, Number(f.n)]));
  }

  async emit(saleId: string, armar: (numero: string) => CreditNote): Promise<CreditNote> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const [{ correlativo }] = await manager.query<{ correlativo: string }[]>(
        `SELECT lpad(nextval('seq_credit_note_number')::text, 10, '0') AS correlativo`,
      );
      const numero = `NCA-${correlativo}`;
      const cn = armar(numero);
      const { cabecera, lineas } = CreditNoteMapper.toPersistence(cn);
      await manager.insert(CreditNoteOrmEntity, cabecera);
      await manager.insert(CreditNoteDetailOrmEntity, lineas);
      return cn;
    });
  }

  // --- CreditNoteCatalog ---

  async saleExists(saleId: string): Promise<boolean> {
    const count = await this.sales.count({ where: { saleId } });
    return count > 0;
  }

  async saleLinesMap(saleId: string): Promise<Map<string, { unitPrice: Money }>> {
    const details = await this.saleDetails.find({ where: { saleId } });
    return new Map(
      details.map((d) => [d.productId, { unitPrice: Money.fromDecimalString(d.unitPrice) }]),
    );
  }
}
