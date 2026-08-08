import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Money } from '../../shared/domain/money.value-object';
import { Payment, PaymentId, PaymentMethod } from '../domain/payment';
import { PAYMENT_REPOSITORY } from '../domain/payment.repository';
import type { PaymentRepository } from '../domain/payment.repository';
import { CreatePaymentCommand } from './payment.commands';

@Injectable()
export class CreatePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly repo: PaymentRepository,
  ) {}

  async run(cmd: CreatePaymentCommand): Promise<Payment> {
    const payment = Payment.create({
      id: PaymentId.of(uuidv4()),
      paymentType: cmd.paymentType,
      referenceType: cmd.referenceType,
      referenceId: cmd.referenceId,
      paymentDate: cmd.paymentDate,
      amount: Money.fromNumber(cmd.amount),
      paymentMethod: (cmd.paymentMethod ?? 'cash') as PaymentMethod,
      notes: cmd.notes,
    });
    await this.repo.insert(payment);
    return payment;
  }
}
