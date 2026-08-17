import { Money } from '../../shared/domain/money.value-object';
import { PurchaseReturnLine, PurchaseReturnLineSnapshot } from './purchase-return-line';
import { InvalidPurchaseReturnError } from './purchase-return.errors';
import { PurchaseReturnId } from './value-objects/purchase-return-id.value-object';

export interface PurchaseReturnSnapshot {
  readonly id: string;
  readonly purchaseId: string;
  readonly number: string;
  readonly date: string;
  readonly hour: string;
  readonly reason: string;
  readonly subTotal: Money;
  readonly igv: Money;
  readonly total: Money;
  readonly lines: readonly PurchaseReturnLineSnapshot[];
}

export class PurchaseReturn {
  static readonly IGV_RATE = 0.18;
  static readonly MAX_LINES = 100;

  private constructor(
    private readonly _id: PurchaseReturnId,
    private readonly _purchaseId: string,
    private readonly _number: string,
    private readonly _date: string,
    private readonly _hour: string,
    private readonly _reason: string,
    private readonly _lines: PurchaseReturnLine[],
  ) {}

  static create(params: {
    id: PurchaseReturnId;
    purchaseId: string;
    number: string;
    date: string;
    hour: string;
    reason: string;
    lines: PurchaseReturnLine[];
  }): PurchaseReturn {
    PurchaseReturn.validarFecha(params.date);
    PurchaseReturn.validarHora(params.hour);
    PurchaseReturn.validarRazon(params.reason);
    PurchaseReturn.validarLineas(params.lines);
    return new PurchaseReturn(
      params.id, params.purchaseId, params.number,
      params.date, params.hour, params.reason, [...params.lines],
    );
  }

  static rehydrate(params: {
    id: PurchaseReturnId;
    purchaseId: string;
    number: string;
    date: string;
    hour: string;
    reason: string;
    lines: PurchaseReturnLine[];
  }): PurchaseReturn {
    return new PurchaseReturn(
      params.id, params.purchaseId, params.number,
      params.date, params.hour, params.reason, [...params.lines],
    );
  }

  private static validarFecha(fecha: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new InvalidPurchaseReturnError(`La fecha debe tener el formato YYYY-MM-DD, se recibio "${fecha}".`);
    }
    const [a, m, d] = fecha.split('-').map(Number);
    const v = new Date(Date.UTC(a, m - 1, d));
    if (v.getUTCFullYear() !== a || v.getUTCMonth() !== m - 1 || v.getUTCDate() !== d) {
      throw new InvalidPurchaseReturnError(`La fecha ${fecha} no existe en el calendario.`);
    }
  }

  private static validarHora(hora: string): void {
    if (!/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(hora)) {
      throw new InvalidPurchaseReturnError(`La hora debe tener el formato HH:MM:SS, se recibio "${hora}".`);
    }
  }

  private static validarRazon(reason: string): void {
    if (!reason || reason.trim().length === 0) {
      throw new InvalidPurchaseReturnError('El motivo de la devolucion es obligatorio.');
    }
    if (reason.trim().length > 500) {
      throw new InvalidPurchaseReturnError('El motivo no puede superar los 500 caracteres.');
    }
  }

  private static validarLineas(lines: PurchaseReturnLine[]): void {
    if (lines.length === 0) {
      throw new InvalidPurchaseReturnError('Una devolucion necesita al menos una linea de detalle.');
    }
    if (lines.length > PurchaseReturn.MAX_LINES) {
      throw new InvalidPurchaseReturnError(`Una devolucion no puede tener mas de ${PurchaseReturn.MAX_LINES} lineas.`);
    }
    const productos = new Set(lines.map((l) => l.productId.value));
    if (productos.size !== lines.length) {
      throw new InvalidPurchaseReturnError('Un producto no puede repetirse en dos lineas de la misma devolucion.');
    }
  }

  get id(): PurchaseReturnId { return this._id; }
  get purchaseId(): string { return this._purchaseId; }
  get number(): string { return this._number; }
  get date(): string { return this._date; }
  get hour(): string { return this._hour; }
  get reason(): string { return this._reason; }
  get lines(): readonly PurchaseReturnLine[] { return this._lines; }

  get subTotal(): Money {
    return Money.fromCentimos(this._lines.reduce((acc, l) => acc + l.partial.centimos, 0));
  }

  get igv(): Money {
    return Money.fromCentimos(Math.round(this.subTotal.centimos * PurchaseReturn.IGV_RATE));
  }

  get total(): Money {
    return Money.fromCentimos(this.subTotal.centimos + this.igv.centimos);
  }

  toSnapshot(): PurchaseReturnSnapshot {
    return {
      id: this._id.value,
      purchaseId: this._purchaseId,
      number: this._number,
      date: this._date,
      hour: this._hour,
      reason: this._reason,
      subTotal: this.subTotal,
      igv: this.igv,
      total: this.total,
      lines: this._lines.map((l) => l.toSnapshot()),
    };
  }
}
