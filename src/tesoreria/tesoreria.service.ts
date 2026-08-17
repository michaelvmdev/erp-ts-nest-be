import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { TreasuryAccountOrmEntity } from './infrastructure/persistence/treasury-account.orm-entity';
import { TreasuryMovementOrmEntity } from './infrastructure/persistence/treasury-movement.orm-entity';

@Injectable()
export class TesoreriaService {
  constructor(
    @InjectRepository(TreasuryAccountOrmEntity)
    private readonly accountsRepo: Repository<TreasuryAccountOrmEntity>,
    @InjectRepository(TreasuryMovementOrmEntity)
    private readonly movementsRepo: Repository<TreasuryMovementOrmEntity>,
  ) {}

  // ── Accounts ─────────────────────────────────────────────────────────────

  async listAccounts() {
    const accounts = await this.accountsRepo.find({ where: { active: true }, order: { name: 'ASC' } });
    const result = await Promise.all(accounts.map(async (a) => {
      const balance = await this.getBalance(a.accountId);
      return {
        accountId:      a.accountId,
        name:           a.name,
        type:           a.type,
        currency:       a.currency,
        bankName:       a.bankName,
        accountNumber:  a.accountNumber,
        initialBalance: parseFloat(a.initialBalance),
        currentBalance: balance,
      };
    }));
    return result;
  }

  async createAccount(dto: {
    name: string; type: string; currency?: string;
    bankName?: string; accountNumber?: string; initialBalance?: number;
  }) {
    const a = new TreasuryAccountOrmEntity();
    a.accountId      = randomUUID();
    a.name           = dto.name;
    a.type           = dto.type;
    a.currency       = dto.currency ?? 'PEN';
    a.bankName       = dto.bankName ?? null;
    a.accountNumber  = dto.accountNumber ?? null;
    a.initialBalance = (dto.initialBalance ?? 0).toFixed(2);
    return this.accountsRepo.save(a);
  }

  private async getBalance(accountId: string): Promise<number> {
    const account = await this.accountsRepo.findOne({ where: { accountId } });
    if (!account) return 0;
    const initial = parseFloat(account.initialBalance);

    const result = await this.movementsRepo
      .createQueryBuilder('m')
      .select(`SUM(CASE WHEN m.type = 'income' THEN m.amount WHEN m.type = 'transfer' AND m.account_id = :id THEN -m.amount ELSE -m.amount END)`, 'net')
      .where('m.account_id = :id OR (m.type = :transfer AND m.related_account_id = :id)', { id: accountId, transfer: 'transfer' })
      .getRawOne<{ net: string | null }>();

    return initial + parseFloat(result?.net ?? '0');
  }

  // ── Movements ─────────────────────────────────────────────────────────────

  async createMovement(dto: {
    accountId: string; type: string; amount: number;
    description: string; reference?: string; category?: string;
    movementDate: string; relatedAccountId?: string;
  }) {
    const account = await this.accountsRepo.findOne({ where: { accountId: dto.accountId } });
    if (!account) throw new NotFoundException(`Cuenta ${dto.accountId} no encontrada.`);

    const m = new TreasuryMovementOrmEntity();
    m.movementId       = randomUUID();
    m.accountId        = dto.accountId;
    m.type             = dto.type;
    m.amount           = dto.amount.toFixed(2);
    m.description      = dto.description;
    m.reference        = dto.reference ?? null;
    m.category         = dto.category ?? null;
    m.movementDate     = dto.movementDate;
    m.relatedAccountId = dto.relatedAccountId ?? null;
    return this.movementsRepo.save(m);
  }

  async searchMovements(accountId?: string, type?: string, dateFrom?: string, dateTo?: string, page = 1, limit = 20) {
    const qb = this.movementsRepo
      .createQueryBuilder('m')
      .orderBy('m.movement_date', 'DESC')
      .addOrderBy('m.created_at', 'DESC');

    if (accountId) qb.andWhere('m.account_id = :accountId', { accountId });
    if (type)      qb.andWhere('m.type = :type', { type });
    if (dateFrom)  qb.andWhere('m.movement_date >= :dateFrom', { dateFrom });
    if (dateTo)    qb.andWhere('m.movement_date <= :dateTo',   { dateTo });

    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((m) => ({
        movementId:      m.movementId,
        accountId:       m.accountId,
        type:            m.type,
        amount:          parseFloat(m.amount),
        description:     m.description,
        reference:       m.reference,
        category:        m.category,
        movementDate:    m.movementDate,
        relatedAccountId: m.relatedAccountId,
        createdAt:       m.createdAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async cashFlow(year: number) {
    const rows = await this.movementsRepo
      .createQueryBuilder('m')
      .select(`TO_CHAR(m.movement_date, 'YYYY-MM')`, 'period')
      .addSelect(`SUM(CASE WHEN m.type = 'income' THEN m.amount ELSE 0 END)`, 'income')
      .addSelect(`SUM(CASE WHEN m.type = 'expense' THEN m.amount ELSE 0 END)`, 'expense')
      .where(`EXTRACT(YEAR FROM m.movement_date) = :year`, { year })
      .groupBy(`TO_CHAR(m.movement_date, 'YYYY-MM')`)
      .orderBy(`TO_CHAR(m.movement_date, 'YYYY-MM')`, 'ASC')
      .getRawMany<{ period: string; income: string; expense: string }>();

    return rows.map((r) => ({
      period:  r.period,
      income:  parseFloat(r.income ?? '0'),
      expense: parseFloat(r.expense ?? '0'),
      net:     parseFloat(r.income ?? '0') - parseFloat(r.expense ?? '0'),
    }));
  }
}
