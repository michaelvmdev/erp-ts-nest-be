import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Page } from '../../../shared/domain/pagination';
import { JournalEntry, JournalEntryId } from '../../domain/journal-entry';
import {
  JournalEntrySummary,
  JournalRepository,
  JournalSearchCriteria,
} from '../../domain/journal.repository';
import { JournalEntryOrmEntity } from './journal-entry.orm-entity';
import { JournalMapper } from './journal.mapper';

@Injectable()
export class TypeOrmJournalRepository implements JournalRepository {
  constructor(
    @InjectRepository(JournalEntryOrmEntity)
    private readonly repo: Repository<JournalEntryOrmEntity>,
    @InjectDataSource()
    private readonly ds: DataSource,
  ) {}

  async findById(id: JournalEntryId): Promise<JournalEntry | null> {
    const orm = await this.repo.findOne({
      where: { entryId: id.value },
      relations: ['lines'],
      order: { lines: { lineNumber: 'ASC' } },
    });
    return orm ? JournalMapper.toDomain(orm) : null;
  }

  async search(c: JournalSearchCriteria): Promise<Page<JournalEntrySummary>> {
    const qb = this.repo
      .createQueryBuilder('e')
      .select([
        'e.entryId        AS "id"',
        'e.entryNumber    AS "entryNumber"',
        'e.entryDate      AS "entryDate"',
        'e.description    AS "description"',
        'e.referenceType  AS "referenceType"',
        'e.referenceId    AS "referenceId"',
      ])
      .addSelect(
        `(SELECT COALESCE(SUM(l.debit),0)
            FROM journal_lines l
           WHERE l.entry_id = e.entry_id)`,
        'totalDebit',
      )
      .addSelect(
        `(SELECT COUNT(*)
            FROM journal_lines l
           WHERE l.entry_id = e.entry_id)`,
        'lineCount',
      )
      .orderBy('e.entryDate', 'DESC')
      .addOrderBy('e.entryNumber', 'DESC');

    if (c.dateFrom) qb.andWhere('e.entryDate >= :from', { from: c.dateFrom });
    if (c.dateTo)   qb.andWhere('e.entryDate <= :to',   { to:   c.dateTo   });
    if (c.referenceType) qb.andWhere('e.referenceType = :rt', { rt: c.referenceType });
    if (c.accountCode) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM journal_lines l2 WHERE l2.entry_id = e.entry_id AND l2.account_code = :ac)`,
        { ac: c.accountCode },
      );
    }

    const total = await qb.getCount();
    const rows  = await qb
      .limit(c.limit)
      .offset((c.page - 1) * c.limit)
      .getRawMany<{
        id: string; entryNumber: string; entryDate: string;
        description: string; referenceType: string; referenceId: string | null;
        totalDebit: string; lineCount: string;
      }>();

    const items: JournalEntrySummary[] = rows.map((r) => ({
      id:            r.id,
      entryNumber:   r.entryNumber,
      entryDate:     r.entryDate,
      description:   r.description,
      referenceType: r.referenceType as JournalEntrySummary['referenceType'],
      referenceId:   r.referenceId,
      totalDebit:    r.totalDebit ?? '0.00',
      lineCount:     Number(r.lineCount),
    }));

    return new Page(items, total, c.page, c.limit);
  }

  async emit(armar: (numero: string) => JournalEntry): Promise<JournalEntry> {
    return this.ds.transaction(async (em) => {
      const [{ correlativo }] = await em.query<[{ correlativo: string }]>(
        `SELECT lpad(nextval('seq_journal_number')::text, 10, '0') AS correlativo`,
      );
      const numero = `ASI-${correlativo}`;
      const entry  = armar(numero);
      const orm    = JournalMapper.toOrm(entry);
      await em.save(JournalEntryOrmEntity, orm);
      return entry;
    });
  }
}
