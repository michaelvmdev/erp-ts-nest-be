import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../../../shared/domain/pagination';
import { Money } from '../../../shared/domain/money.value-object';
import { Payment, PaymentId } from '../../domain/payment';
import { PAYMENT_REPOSITORY } from '../../domain/payment.repository';
import type { PaymentRepository, PaymentSearchCriteria } from '../../domain/payment.repository';
import { PaymentOrmEntity } from './payment.orm-entity';

@Injectable()
export class TypeOrmPaymentRepository implements PaymentRepository {
  constructor(
    @InjectRepository(PaymentOrmEntity)
    private readonly orm: Repository<PaymentOrmEntity>,
  ) {}

  private toDomain(row: PaymentOrmEntity): Payment {
    return Payment.rehydrate({
      id: PaymentId.of(row.paymentId),
      paymentType: row.paymentType,
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      paymentDate: row.paymentDate,
      amount: Money.fromNumber(Number(row.amount)),
      paymentMethod: row.paymentMethod,
      notes: row.notes,
      createdAt: row.createdAt,
    });
  }

  async findById(id: PaymentId): Promise<Payment | null> {
    const row = await this.orm.findOne({ where: { paymentId: id.value } });
    return row ? this.toDomain(row) : null;
  }

  async search(criteria: PaymentSearchCriteria): Promise<Page<Payment>> {
    const qb = this.orm.createQueryBuilder('p').orderBy('p.payment_date', 'DESC');

    if (criteria.referenceType) qb.andWhere('p.reference_type = :rt', { rt: criteria.referenceType });
    if (criteria.referenceId) qb.andWhere('p.reference_id = :ri', { ri: criteria.referenceId });
    if (criteria.paymentType) qb.andWhere('p.payment_type = :pt', { pt: criteria.paymentType });
    if (criteria.paymentMethod) qb.andWhere('p.payment_method = :pm', { pm: criteria.paymentMethod });
    if (criteria.dateFrom) qb.andWhere('p.payment_date >= :df', { df: criteria.dateFrom });
    if (criteria.dateTo) qb.andWhere('p.payment_date <= :dt', { dt: criteria.dateTo });

    const total = await qb.getCount();
    const rows = await qb.skip(criteria.page.offset).take(criteria.page.limit).getMany();
    const items = rows.map(r => this.toDomain(r));
    return new Page<Payment>(items, total, criteria.page.page, criteria.page.limit);
  }

  async insert(payment: Payment): Promise<void> {
    const snap = payment.toSnapshot();
    await this.orm.insert({
      paymentId: snap.id,
      paymentType: snap.paymentType,
      referenceType: snap.referenceType,
      referenceId: snap.referenceId,
      paymentDate: snap.paymentDate,
      amount: snap.amount.toNumber().toFixed(2),
      paymentMethod: snap.paymentMethod,
      notes: snap.notes,
      createdAt: snap.createdAt,
    });
  }

  async delete(id: PaymentId): Promise<boolean> {
    const result = await this.orm.delete({ paymentId: id.value });
    return (result.affected ?? 0) > 0;
  }
}

export const PAYMENT_REPOSITORY_PROVIDER = {
  provide: PAYMENT_REPOSITORY,
  useClass: TypeOrmPaymentRepository,
};
