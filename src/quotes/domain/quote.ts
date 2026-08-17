import { ClientId } from '../../clients/domain/value-objects/client-id.value-object';
import { InvalidInputError } from '../../shared/domain/domain.error';
import { Money } from '../../shared/domain/money.value-object';
import { QuoteLine, QuoteLineSnapshot } from './quote-line';
import { QuoteId } from './value-objects/quote-id.value-object';
import { QuoteInvalidStatusTransitionError } from './quote.errors';

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export class InvalidQuoteError extends InvalidInputError {
  readonly code = 'INVALID_QUOTE';
  constructor(message: string) {
    super(message);
  }
}

export interface QuoteSnapshot {
  readonly id: string;
  readonly number: string;
  readonly status: QuoteStatus;
  readonly clientId: string;
  readonly date: string;
  readonly validUntil: string;
  readonly notes: string | null;
  readonly subTotal: Money;
  readonly igv: Money;
  readonly total: Money;
  readonly lines: readonly QuoteLineSnapshot[];
  readonly createdAt: Date;
}

const ALLOWED_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft:    ['sent', 'rejected'],
  sent:     ['accepted', 'rejected', 'expired'],
  accepted: [],
  rejected: [],
  expired:  [],
};

export class Quote {
  static readonly IGV_RATE = 0.18;
  static readonly MAX_LINES = 100;

  private _status: QuoteStatus;
  private _lines: QuoteLine[];

  private constructor(
    private readonly _id: QuoteId,
    private readonly _number: string,
    status: QuoteStatus,
    private readonly _clientId: ClientId,
    private readonly _date: string,
    private readonly _validUntil: string,
    private _notes: string | null,
    lines: QuoteLine[],
    private readonly _createdAt: Date,
  ) {
    this._status = status;
    this._lines = lines;
  }

  static create(params: {
    id: QuoteId;
    number: string;
    clientId: ClientId;
    date: string;
    validUntil: string;
    notes?: string | null;
    lines: QuoteLine[];
  }): Quote {
    Quote.validarFecha(params.date, 'date');
    Quote.validarFecha(params.validUntil, 'validUntil');
    if (params.validUntil < params.date) {
      throw new InvalidQuoteError(
        'La fecha de vencimiento no puede ser anterior a la fecha de emision.',
      );
    }
    Quote.validarLineas(params.lines);
    return new Quote(
      params.id,
      params.number,
      'draft',
      params.clientId,
      params.date,
      params.validUntil,
      params.notes ?? null,
      [...params.lines],
      new Date(),
    );
  }

  static rehydrate(params: {
    id: QuoteId;
    number: string;
    status: QuoteStatus;
    clientId: ClientId;
    date: string;
    validUntil: string;
    notes: string | null;
    lines: QuoteLine[];
    createdAt: Date;
  }): Quote {
    return new Quote(
      params.id,
      params.number,
      params.status,
      params.clientId,
      params.date,
      params.validUntil,
      params.notes,
      [...params.lines],
      params.createdAt,
    );
  }

  private static validarFecha(fecha: string, campo: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new InvalidQuoteError(
        `El campo ${campo} debe tener formato YYYY-MM-DD, se recibio "${fecha}".`,
      );
    }
    const [a, m, d] = fecha.split('-').map(Number);
    const valida = new Date(Date.UTC(a, m - 1, d));
    if (
      valida.getUTCFullYear() !== a ||
      valida.getUTCMonth() !== m - 1 ||
      valida.getUTCDate() !== d
    ) {
      throw new InvalidQuoteError(`La fecha ${fecha} no existe en el calendario.`);
    }
  }

  private static validarLineas(lines: QuoteLine[]): void {
    if (lines.length === 0) {
      throw new InvalidQuoteError('Una cotizacion necesita al menos una linea de detalle.');
    }
    if (lines.length > Quote.MAX_LINES) {
      throw new InvalidQuoteError(
        `Una cotizacion no puede tener mas de ${Quote.MAX_LINES} lineas, se recibieron ${lines.length}.`,
      );
    }
    const productos = new Set(lines.map((l) => l.productId.value));
    if (productos.size !== lines.length) {
      throw new InvalidQuoteError(
        'Un producto no puede repetirse en dos lineas de la misma cotizacion.',
      );
    }
  }

  transitionTo(newStatus: QuoteStatus): void {
    const allowed = ALLOWED_TRANSITIONS[this._status];
    if (!allowed.includes(newStatus)) {
      throw new QuoteInvalidStatusTransitionError(this._status, newStatus);
    }
    this._status = newStatus;
  }

  get id(): QuoteId       { return this._id; }
  get number(): string    { return this._number; }
  get status(): QuoteStatus { return this._status; }
  get clientId(): ClientId { return this._clientId; }
  get date(): string      { return this._date; }
  get validUntil(): string { return this._validUntil; }
  get notes(): string | null { return this._notes; }
  get lines(): readonly QuoteLine[] { return this._lines; }
  get createdAt(): Date   { return this._createdAt; }

  get subTotal(): Money {
    return Money.fromCentimos(this._lines.reduce((acc, l) => acc + l.partial.centimos, 0));
  }

  get igv(): Money {
    return Money.fromCentimos(Math.round(this.subTotal.centimos * Quote.IGV_RATE));
  }

  get total(): Money {
    return Money.fromCentimos(this.subTotal.centimos + this.igv.centimos);
  }

  toSnapshot(): QuoteSnapshot {
    return {
      id: this._id.value,
      number: this._number,
      status: this._status,
      clientId: this._clientId.value,
      date: this._date,
      validUntil: this._validUntil,
      notes: this._notes,
      subTotal: this.subTotal,
      igv: this.igv,
      total: this.total,
      lines: this._lines.map((l) => l.toSnapshot()),
      createdAt: this._createdAt,
    };
  }
}
