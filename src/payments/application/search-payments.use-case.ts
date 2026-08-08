import { Inject, Injectable } from '@nestjs/common';
import type { Page } from '../../shared/domain/pagination';
import { Payment } from '../domain/payment';
import { PAYMENT_REPOSITORY } from '../domain/payment.repository';
import type { PaymentRepository } from '../domain/payment.repository';
import { SearchPaymentsQuery } from './payment.commands';

@Injectable()
export class SearchPaymentsUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly repo: PaymentRepository,
  ) {}

  async run(query: SearchPaymentsQuery): Promise<Page<Payment>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    return this.repo.search({
      referenceType: query.referenceType,
      referenceId: query.referenceId,
      paymentType: query.paymentType,
      paymentMethod: query.paymentMethod,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: { page, limit, offset },
    });
  }
}
