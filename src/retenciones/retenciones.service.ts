import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { RetencionOrmEntity } from './infrastructure/persistence/retencion.orm-entity';

const RETENCION_RATE = 0.03; // 3% IGV retención

@Injectable()
export class RetencionesService {
  constructor(
    @InjectRepository(RetencionOrmEntity)
    private readonly repo: Repository<RetencionOrmEntity>,
  ) {}

  async list(period?: string, supplierId?: string, status?: string, page = 1, limit = 20) {
    const qb = this.repo.createQueryBuilder('r').orderBy('r.createdAt', 'DESC');
    if (period)     qb.andWhere('r.period = :period', { period });
    if (supplierId) qb.andWhere('r.supplierId = :supplierId', { supplierId });
    if (status)     qb.andWhere('r.status = :status', { status });
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items: items.map(this.map), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async create(dto: { purchaseId: string; supplierId: string; baseAmount: number; period: string; notes?: string }) {
    const r = new RetencionOrmEntity();
    r.retencionId     = randomUUID();
    r.purchaseId      = dto.purchaseId;
    r.supplierId      = dto.supplierId;
    r.baseAmount      = dto.baseAmount.toFixed(2);
    r.retencionAmount = (dto.baseAmount * RETENCION_RATE).toFixed(2);
    r.period          = dto.period;
    r.status          = 'pending';
    r.notes           = dto.notes ?? null;
    r.paidAt          = null;
    await this.repo.save(r);
    return this.map(r);
  }

  async pay(retencionId: string) {
    const r = await this.repo.findOne({ where: { retencionId } });
    if (!r) throw new NotFoundException(`Retención ${retencionId} no encontrada.`);
    r.status = 'paid';
    r.paidAt = new Date();
    await this.repo.save(r);
    return this.map(r);
  }

  private map(r: RetencionOrmEntity) {
    return {
      retencionId:     r.retencionId,
      purchaseId:      r.purchaseId,
      supplierId:      r.supplierId,
      baseAmount:      parseFloat(r.baseAmount),
      retencionAmount: parseFloat(r.retencionAmount),
      period:          r.period,
      status:          r.status,
      notes:           r.notes,
      paidAt:          r.paidAt,
      createdAt:       r.createdAt,
    };
  }
}
