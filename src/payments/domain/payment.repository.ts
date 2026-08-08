import { Page } from '../../shared/domain/pagination';
import { Payment, PaymentMethod, PaymentType, ReferenceType } from './payment';
import { PaymentId } from './payment';

export interface PaymentSearchCriteria {
  readonly referenceType?: ReferenceType;
  readonly referenceId?: string;
  readonly paymentType?: PaymentType;
  readonly paymentMethod?: PaymentMethod;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly page: { page: number; limit: number; offset: number };
}

export interface PaymentRepository {
  findById(id: PaymentId): Promise<Payment | null>;
  search(criteria: PaymentSearchCriteria): Promise<Page<Payment>>;
  insert(payment: Payment): Promise<void>;
  delete(id: PaymentId): Promise<boolean>;
}

export const PAYMENT_REPOSITORY = Symbol('PaymentRepository');
