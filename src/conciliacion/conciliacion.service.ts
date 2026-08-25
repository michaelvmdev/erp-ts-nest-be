import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import { BankStatementLineOrmEntity } from './infrastructure/persistence/bank-statement-line.orm-entity';

@Injectable()
export class ConciliacionService {
  constructor(
    @InjectRepository(BankStatementLineOrmEntity)
    private readonly repo: Repository<BankStatementLineOrmEntity>,
    private readonly ds: DataSource,
  ) {}

  async listLines(period: string, matchStatus?: string, page = 1, limit = 50) {
    const qb = this.repo.createQueryBuilder('l')
      .where('l.period = :period', { period })
      .orderBy('l.movementDate', 'ASC');
    if (matchStatus) qb.andWhere('l.matchStatus = :matchStatus', { matchStatus });
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items: items.map(this.mapLine), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async importLines(period: string, lines: Array<{ movementDate: string; description: string; amount: number; reference?: string }>) {
    const entities = lines.map((l) => {
      const e = new BankStatementLineOrmEntity();
      e.lineId       = randomUUID();
      e.period       = period;
      e.movementDate = l.movementDate;
      e.description  = l.description;
      e.amount       = l.amount.toFixed(2);
      e.reference    = l.reference ?? null;
      e.treasuryMovementId = null;
      e.matchStatus  = 'unmatched';
      return e;
    });
    await this.repo.save(entities);
    return { imported: entities.length };
  }

  async matchLine(lineId: string, treasuryMovementId: string) {
    const line = await this.repo.findOne({ where: { lineId } });
    if (!line) throw new NotFoundException(`Línea ${lineId} no encontrada.`);
    line.treasuryMovementId = treasuryMovementId;
    line.matchStatus = 'matched';
    await this.repo.save(line);
    return this.mapLine(line);
  }

  async ignoreLine(lineId: string) {
    const line = await this.repo.findOne({ where: { lineId } });
    if (!line) throw new NotFoundException(`Línea ${lineId} no encontrada.`);
    line.matchStatus = 'ignored';
    await this.repo.save(line);
    return this.mapLine(line);
  }

  async summary(period: string) {
    const [rows] = await this.ds.query<{ match_status: string; count: string; total: string }[]>(`
      SELECT match_status, COUNT(*)::int as count, SUM(amount) as total
      FROM bank_statement_lines
      WHERE period = $1
      GROUP BY match_status
    `, [period]);
    const bankTotal = await this.ds.query<[{ total: string }]>(`SELECT COALESCE(SUM(amount),0) as total FROM bank_statement_lines WHERE period = $1`, [period]);
    const treasuryTotal = await this.ds.query<[{ total: string }]>(`
      SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0) as total
      FROM treasury_movements
      WHERE LEFT(movement_date::text, 7) = $1
    `, [period]);
    return {
      period,
      bankTotal:     parseFloat((bankTotal as unknown as [{ total: string }])[0]?.total ?? '0'),
      treasuryTotal: parseFloat((treasuryTotal as unknown as [{ total: string }])[0]?.total ?? '0'),
      lines:         Array.isArray(rows) ? rows : [],
    };
  }

  private mapLine(l: BankStatementLineOrmEntity) {
    return {
      lineId:             l.lineId,
      period:             l.period,
      movementDate:       l.movementDate,
      description:        l.description,
      amount:             parseFloat(l.amount),
      reference:          l.reference,
      treasuryMovementId: l.treasuryMovementId,
      matchStatus:        l.matchStatus,
      createdAt:          l.createdAt,
    };
  }
}
