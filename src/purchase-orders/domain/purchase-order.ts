import { Money } from '../../shared/domain/money.value-object';
import { PurchaseOrderLine, PurchaseOrderLineSnapshot } from './purchase-order-line';
import {
  InvalidPurchaseOrderError,
  PurchaseOrderStatusTransitionError,
} from './purchase-order.errors';
import { PurchaseOrderId } from './value-objects/purchase-order-id.value-object';

export type PurchaseOrderStatus =
  | 'pending'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'partial'
  | 'received'
  | 'cancelled';

const ALLOWED_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  pending:          ['partial', 'received', 'cancelled', 'pending_approval'],
  pending_approval: ['approved', 'rejected'],
  approved:         ['partial', 'received', 'cancelled'],
  rejected:         [],
  partial:          ['received', 'cancelled'],
  received:         [],
  cancelled:        [],
};

export interface PurchaseOrderSnapshot {
  readonly id: string;
  readonly supplierId: string;
  readonly date: string;
  readonly status: PurchaseOrderStatus;
  readonly notes: string | null;
  readonly subTotal: Money;
  readonly igv: Money;
  readonly total: Money;
  readonly lines: readonly PurchaseOrderLineSnapshot[];
}

export class PurchaseOrder {
  static readonly IGV_RATE = 0.18;
  static readonly MAX_LINES = 100;

  private constructor(
    private readonly _id: PurchaseOrderId,
    private readonly _supplierId: string,
    private readonly _date: string,
    private _status: PurchaseOrderStatus,
    private _notes: string | null,
    private _lines: PurchaseOrderLine[],
  ) {}

  static create(params: {
    id: PurchaseOrderId;
    supplierId: string;
    date: string;
    notes?: string | null;
    lines: PurchaseOrderLine[];
  }): PurchaseOrder {
    PurchaseOrder.validarFecha(params.date);
    PurchaseOrder.validarLineas(params.lines);
    return new PurchaseOrder(
      params.id, params.supplierId, params.date, 'pending',
      params.notes ?? null, [...params.lines],
    );
  }

  static rehydrate(params: {
    id: PurchaseOrderId;
    supplierId: string;
    date: string;
    status: PurchaseOrderStatus;
    notes: string | null;
    lines: PurchaseOrderLine[];
  }): PurchaseOrder {
    return new PurchaseOrder(
      params.id, params.supplierId, params.date, params.status,
      params.notes, [...params.lines],
    );
  }

  private static validarFecha(fecha: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new InvalidPurchaseOrderError(`La fecha debe tener el formato YYYY-MM-DD.`);
    }
  }

  private static validarLineas(lines: PurchaseOrderLine[]): void {
    if (lines.length === 0) {
      throw new InvalidPurchaseOrderError('Una orden de compra necesita al menos una linea.');
    }
    if (lines.length > PurchaseOrder.MAX_LINES) {
      throw new InvalidPurchaseOrderError(`No puede tener mas de ${PurchaseOrder.MAX_LINES} lineas.`);
    }
    const productos = new Set(lines.map((l) => l.productId.value));
    if (productos.size !== lines.length) {
      throw new InvalidPurchaseOrderError('Un producto no puede repetirse en dos lineas.');
    }
  }

  get id(): PurchaseOrderId { return this._id; }
  get supplierId(): string { return this._supplierId; }
  get date(): string { return this._date; }
  get status(): PurchaseOrderStatus { return this._status; }
  get notes(): string | null { return this._notes; }
  get lines(): readonly PurchaseOrderLine[] { return this._lines; }

  get subTotal(): Money {
    return Money.fromCentimos(this._lines.reduce((acc, l) => acc + l.partial.centimos, 0));
  }

  get igv(): Money {
    return Money.fromCentimos(Math.round(this.subTotal.centimos * PurchaseOrder.IGV_RATE));
  }

  get total(): Money {
    return Money.fromCentimos(this.subTotal.centimos + this.igv.centimos);
  }

  transitionTo(newStatus: PurchaseOrderStatus): void {
    const allowed = ALLOWED_TRANSITIONS[this._status];
    if (!allowed.includes(newStatus)) {
      throw new PurchaseOrderStatusTransitionError(this._status, newStatus);
    }
    this._status = newStatus;
  }

  changeNotes(notes: string | null): void {
    this._notes = notes;
  }

  toSnapshot(): PurchaseOrderSnapshot {
    return {
      id: this._id.value,
      supplierId: this._supplierId,
      date: this._date,
      status: this._status,
      notes: this._notes,
      subTotal: this.subTotal,
      igv: this.igv,
      total: this.total,
      lines: this._lines.map((l) => l.toSnapshot()),
    };
  }
}
