import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ClientOrmEntity } from '../../../clients/infrastructure/persistence/client.orm-entity';
import { ProductOrmEntity } from '../../../products/infrastructure/persistence/product.orm-entity';
// ClientOrmEntity is used for @InjectRepository and direct queries
import { Money } from '../../../shared/domain/money.value-object';
import { Page } from '../../../shared/domain/pagination';
import { Quote } from '../../domain/quote';
import type { QuoteCatalog, QuoteRepository, QuoteSearchCriteria, QuoteSummary } from '../../domain/quote.repository';
import { QuoteId } from '../../domain/value-objects/quote-id.value-object';
import { QuoteMapper } from './quote.mapper';
import { QuoteDetailOrmEntity, QuoteOrmEntity } from './quote.orm-entity';

@Injectable()
export class TypeOrmQuoteRepository implements QuoteRepository, QuoteCatalog {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(QuoteOrmEntity)
    private readonly quotesRepo: Repository<QuoteOrmEntity>,
    @InjectRepository(QuoteDetailOrmEntity)
    private readonly detailsRepo: Repository<QuoteDetailOrmEntity>,
    @InjectRepository(ClientOrmEntity)
    private readonly clientsRepo: Repository<ClientOrmEntity>,
    @InjectRepository(ProductOrmEntity)
    private readonly productsRepo: Repository<ProductOrmEntity>,
  ) {}

  async findById(id: QuoteId): Promise<Quote | null> {
    const row = await this.quotesRepo.findOne({ where: { quoteId: id.value } });
    if (!row) return null;
    const details = await this.detailsRepo.find({ where: { quoteId: id.value } });
    return QuoteMapper.toDomain(row, details);
  }

  async search(criteria: QuoteSearchCriteria): Promise<Page<QuoteSummary>> {
    const page  = criteria.page  ?? 1;
    const limit = criteria.limit ?? 20;

    const qb = this.quotesRepo.createQueryBuilder('q');

    if (criteria.clientId) {
      qb.andWhere('q.clientId = :clientId', { clientId: criteria.clientId });
    }
    if (criteria.status) {
      qb.andWhere('q.status = :status', { status: criteria.status });
    }
    if (criteria.dateFrom) {
      qb.andWhere('q.quoteDate >= :desde', { desde: criteria.dateFrom });
    }
    if (criteria.dateTo) {
      qb.andWhere('q.quoteDate <= :hasta', { hasta: criteria.dateTo });
    }

    qb.orderBy('q.quoteDate', 'DESC').addOrderBy('q.quoteId', 'ASC');
    qb.skip((page - 1) * limit).take(limit);

    const [rows, total] = await qb.getManyAndCount();

    const [lineCountMap, clientNameMap] = await Promise.all([
      this.contarLineas(rows.map((r) => r.quoteId)),
      this.obtenerNombresCliente(rows.map((r) => r.clientId)),
    ]);

    return new Page(
      rows.map((row) =>
        QuoteMapper.toSummary(
          Object.assign(row, {
            clientName: clientNameMap.get(row.clientId) ?? '',
            lineCount: lineCountMap.get(row.quoteId) ?? 0,
          }),
        ),
      ),
      total,
      page,
      limit,
    );
  }

  private async contarLineas(ids: string[]): Promise<Map<string, number>> {
    if (ids.length === 0) return new Map();
    const rows = await this.detailsRepo
      .createQueryBuilder('d')
      .select('d.quoteId', 'quoteId')
      .addSelect('COUNT(*)', 'n')
      .where('d.quoteId IN (:...ids)', { ids })
      .groupBy('d.quoteId')
      .getRawMany<{ quoteId: string; n: string }>();
    return new Map(rows.map((r) => [r.quoteId, Number(r.n)]));
  }

  private async obtenerNombresCliente(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const uniq = [...new Set(ids)];
    const rows = await this.clientsRepo
      .createQueryBuilder('c')
      .select('c.clientId', 'clientId')
      .addSelect('c.clientDescription', 'name')
      .where('c.clientId IN (:...ids)', { ids: uniq })
      .getRawMany<{ clientId: string; name: string }>();
    return new Map(rows.map((r) => [r.clientId, r.name]));
  }

  async emit(armar: (numero: string) => Quote): Promise<Quote> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const [{ correlativo }] = await manager.query<{ correlativo: string }[]>(
        `SELECT lpad(nextval('seq_quote_number')::text, 10, '0') AS correlativo`,
      );
      const numero = `COT-${correlativo}`;
      const quote = armar(numero);
      const { header, details } = QuoteMapper.toPersistence(quote);
      await manager.insert(QuoteOrmEntity, header);
      if (details.length > 0) {
        await manager.insert(QuoteDetailOrmEntity, details);
      }
      return quote;
    });
  }

  async update(quote: Quote): Promise<void> {
    const { header } = QuoteMapper.toPersistence(quote);
    await this.quotesRepo.update({ quoteId: quote.id.value }, { status: header.status });
  }

  // --- QuoteCatalog ---

  async clientState(clientId: string): Promise<{ active: boolean; name: string } | null> {
    const row = await this.clientsRepo.findOne({ where: { clientId } });
    if (!row) return null;
    return { active: row.clientActive, name: row.clientDescription };
  }

  async productsState(
    productIds: readonly string[],
  ): Promise<Map<string, { price: Money; active: boolean }>> {
    if (productIds.length === 0) return new Map();
    const rows = await this.productsRepo
      .createQueryBuilder('p')
      .where('p.productId IN (:...ids)', { ids: [...productIds] })
      .getMany();
    return new Map(
      rows.map((p) => [
        p.productId,
        {
          price: Money.fromDecimalString(p.productUnitPrice),
          active: p.productActive,
        },
      ]),
    );
  }
}
