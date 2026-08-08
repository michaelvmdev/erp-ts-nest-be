import { Inject, Injectable } from '@nestjs/common';
import { PaymentId, PaymentNotFoundError } from '../domain/payment';
import { PAYMENT_REPOSITORY } from '../domain/payment.repository';
import type { PaymentRepository } from '../domain/payment.repository';

@Injectable()
export class DeletePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly repo: PaymentRepository,
  ) {}

  async run(id: string): Promise<void> {
    const paymentId = PaymentId.of(id);
    const deleted = await this.repo.delete(paymentId);
    if (!deleted) throw new PaymentNotFoundError(id);
  }
}
