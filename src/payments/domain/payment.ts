import { InvalidInputError, NotFoundError } from '../../shared/domain/domain.error';
import { Money } from '../../shared/domain/money.value-object';
import { UuidValueObject } from '../../shared/domain/uuid.value-object';

export type PaymentType = 'income' | 'expense';
export type ReferenceType = 'sale' | 'purchase' | 'credit_note' | 'purchase_order';
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'check';

export class PaymentId extends UuidValueObject {
  static of(valor: string): PaymentId {
    return new PaymentId(this.ensureValid('El id de pago', valor));
  }
}

export class InvalidPaymentError extends InvalidInputError {
  readonly code = 'INVALID_PAYMENT';
  constructor(message: string) { super(message); }
}

export class PaymentNotFoundError extends NotFoundError {
  readonly code = 'PAYMENT_NOT_FOUND';
  constructor(id: string) { super(`El pago ${id} no existe.`); }
}

export interface PaymentSnapshot {
  readonly id: string;
  readonly paymentType: PaymentType;
  readonly referenceType: ReferenceType;
  readonly referenceId: string;
  readonly paymentDate: string;
  readonly amount: Money;
  readonly paymentMethod: PaymentMethod;
  readonly notes: string | null;
  readonly createdAt: Date;
}

export class Payment {
  private constructor(
    private readonly _id: PaymentId,
    private readonly _paymentType: PaymentType,
    private readonly _referenceType: ReferenceType,
    private readonly _referenceId: string,
    private readonly _paymentDate: string,
    private readonly _amount: Money,
    private readonly _paymentMethod: PaymentMethod,
    private readonly _notes: string | null,
    private readonly _createdAt: Date,
  ) {}

  static create(params: {
    id: PaymentId;
    paymentType: PaymentType;
    referenceType: ReferenceType;
    referenceId: string;
    paymentDate: string;
    amount: Money;
    paymentMethod: PaymentMethod;
    notes?: string | null;
  }): Payment {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(params.paymentDate)) {
      throw new InvalidPaymentError('paymentDate debe tener el formato YYYY-MM-DD.');
    }
    return new Payment(
      params.id, params.paymentType, params.referenceType, params.referenceId,
      params.paymentDate, params.amount, params.paymentMethod,
      params.notes ?? null, new Date(),
    );
  }

  static rehydrate(params: {
    id: PaymentId;
    paymentType: PaymentType;
    referenceType: ReferenceType;
    referenceId: string;
    paymentDate: string;
    amount: Money;
    paymentMethod: PaymentMethod;
    notes: string | null;
    createdAt: Date;
  }): Payment {
    return new Payment(
      params.id, params.paymentType, params.referenceType, params.referenceId,
      params.paymentDate, params.amount, params.paymentMethod,
      params.notes, params.createdAt,
    );
  }

  get id(): PaymentId { return this._id; }
  get paymentType(): PaymentType { return this._paymentType; }
  get referenceType(): ReferenceType { return this._referenceType; }
  get referenceId(): string { return this._referenceId; }
  get paymentDate(): string { return this._paymentDate; }
  get amount(): Money { return this._amount; }
  get paymentMethod(): PaymentMethod { return this._paymentMethod; }
  get notes(): string | null { return this._notes; }
  get createdAt(): Date { return this._createdAt; }

  toSnapshot(): PaymentSnapshot {
    return {
      id: this._id.value,
      paymentType: this._paymentType,
      referenceType: this._referenceType,
      referenceId: this._referenceId,
      paymentDate: this._paymentDate,
      amount: this._amount,
      paymentMethod: this._paymentMethod,
      notes: this._notes,
      createdAt: this._createdAt,
    };
  }
}
