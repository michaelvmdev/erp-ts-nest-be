import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { DetractionCodeOrmEntity } from './infrastructure/persistence/detraction-code.orm-entity';
import { DetraccionOrmEntity } from './infrastructure/persistence/detraccion.orm-entity';

export const SPOT_THRESHOLD_SOLES = 700;

@Injectable()
export class DetraccionesService {
  constructor(
    @InjectRepository(DetractionCodeOrmEntity)
    private readonly codesRepo: Repository<DetractionCodeOrmEntity>,
    @InjectRepository(DetraccionOrmEntity)
    private readonly detraccionesRepo: Repository<DetraccionOrmEntity>,
  ) {}

  async listCodes() {
    const codes = await this.codesRepo.find({ where: { active: true }, order: { code: 'ASC' } });
    return codes.map((c) => ({
      code:        c.code,
      description: c.description,
      rate:        parseFloat(c.rate),
      ratePercent: `${(parseFloat(c.rate) * 100).toFixed(0)}%`,
    }));
  }

  calculate(baseAmountSoles: number, rate: number) {
    const applies = baseAmountSoles > SPOT_THRESHOLD_SOLES;
    const amount  = applies ? Math.ceil(baseAmountSoles * rate * 100) / 100 : 0;
    return { applies, baseAmount: baseAmountSoles, rate, amount, threshold: SPOT_THRESHOLD_SOLES };
  }

  async create(dto: {
    saleId:      string;
    code:        string;
    baseAmount:  number;
  }): Promise<DetraccionOrmEntity> {
    const codeEntity = await this.codesRepo.findOne({ where: { code: dto.code } });
    if (!codeEntity) throw new NotFoundException(`Código de detracción ${dto.code} no existe.`);

    const rate   = parseFloat(codeEntity.rate);
    const amount = Math.ceil(dto.baseAmount * rate * 100) / 100;

    const d = new DetraccionOrmEntity();
    d.detraccionId = randomUUID();
    d.saleId       = dto.saleId;
    d.code         = dto.code;
    d.baseAmount   = dto.baseAmount.toFixed(2);
    d.rate         = codeEntity.rate;
    d.amount       = amount.toFixed(2);
    d.status       = dto.baseAmount > SPOT_THRESHOLD_SOLES ? 'pending' : 'exempt';
    return this.detraccionesRepo.save(d);
  }

  async listBySale(saleId: string) {
    return this.detraccionesRepo.find({ where: { saleId }, order: { createdAt: 'DESC' } });
  }

  async markPaid(detraccionId: string, paymentDate: string, paymentNumber: string) {
    const d = await this.detraccionesRepo.findOne({ where: { detraccionId } });
    if (!d) throw new NotFoundException(`Detracción ${detraccionId} no encontrada.`);
    d.paymentDate   = paymentDate;
    d.paymentNumber = paymentNumber;
    d.status        = 'paid';
    return this.detraccionesRepo.save(d);
  }

  async search(status?: string, page = 1, limit = 20) {
    const qb = this.detraccionesRepo.createQueryBuilder('d').orderBy('d.created_at', 'DESC');
    if (status) qb.where('d.status = :status', { status });
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((d) => ({
        detraccionId:  d.detraccionId,
        saleId:        d.saleId,
        code:          d.code,
        baseAmount:    parseFloat(d.baseAmount),
        rate:          parseFloat(d.rate),
        amount:        parseFloat(d.amount),
        paymentDate:   d.paymentDate,
        paymentNumber: d.paymentNumber,
        status:        d.status,
        createdAt:     d.createdAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
