import { PaymentMethod, PaymentType, ReferenceType } from '../domain/payment';

export interface CreatePaymentCommand {
  readonly paymentType: PaymentType;
  readonly referenceType: ReferenceType;
  readonly referenceId: string;
  readonly paymentDate: string;
  readonly amount: number;
  readonly paymentMethod?: PaymentMethod;
  readonly notes?: string;
}

export interface SearchPaymentsQuery {
  readonly referenceType?: ReferenceType;
  readonly referenceId?: string;
  readonly paymentType?: PaymentType;
  readonly paymentMethod?: PaymentMethod;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly page?: number;
  readonly limit?: number;
}
