import { Money } from '../../shared/domain/money.value-object';
import { CreditNoteLine, CreditNoteLineSnapshot } from './credit-note-line';
import { InvalidCreditNoteError } from './credit-note.errors';
import { CreditNoteId } from './value-objects/credit-note-id.value-object';

export interface CreditNoteSnapshot {
  readonly id: string;
  readonly saleId: string;
  readonly number: string;
  readonly date: string;
  readonly hour: string;
  readonly reason: string;
  readonly subTotal: Money;
  readonly igv: Money;
  readonly total: Money;
  readonly lines: readonly CreditNoteLineSnapshot[];
}

export class CreditNote {
  static readonly IGV_RATE = 0.18;
  static readonly MAX_LINES = 100;

  private constructor(
    private readonly _id: CreditNoteId,
    private readonly _saleId: string,
    private readonly _number: string,
    private readonly _date: string,
    private readonly _hour: string,
    private readonly _reason: string,
    private readonly _lines: CreditNoteLine[],
  ) {}

  static create(params: {
    id: CreditNoteId;
    saleId: string;
    number: string;
    date: string;
    hour: string;
    reason: string;
    lines: CreditNoteLine[];
  }): CreditNote {
    CreditNote.validarFecha(params.date);
    CreditNote.validarHora(params.hour);
    CreditNote.validarRazon(params.reason);
    CreditNote.validarLineas(params.lines);
    return new CreditNote(
      params.id, params.saleId, params.number,
      params.date, params.hour, params.reason, [...params.lines],
    );
  }

  static rehydrate(params: {
    id: CreditNoteId;
    saleId: string;
    number: string;
    date: string;
    hour: string;
    reason: string;
    lines: CreditNoteLine[];
  }): CreditNote {
    return new CreditNote(
      params.id, params.saleId, params.number,
      params.date, params.hour, params.reason, [...params.lines],
    );
  }

  private static validarFecha(fecha: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new InvalidCreditNoteError(`La fecha debe tener el formato YYYY-MM-DD, se recibio "${fecha}".`);
    }
    const [a, m, d] = fecha.split('-').map(Number);
    const v = new Date(Date.UTC(a, m - 1, d));
    if (v.getUTCFullYear() !== a || v.getUTCMonth() !== m - 1 || v.getUTCDate() !== d) {
      throw new InvalidCreditNoteError(`La fecha ${fecha} no existe en el calendario.`);
    }
  }

  private static validarHora(hora: string): void {
    if (!/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(hora)) {
      throw new InvalidCreditNoteError(`La hora debe tener el formato HH:MM:SS, se recibio "${hora}".`);
    }
  }

  private static validarRazon(reason: string): void {
    if (!reason || reason.trim().length === 0) {
      throw new InvalidCreditNoteError('El motivo de la nota de credito es obligatorio.');
    }
    if (reason.trim().length > 500) {
      throw new InvalidCreditNoteError('El motivo no puede superar los 500 caracteres.');
    }
  }

  private static validarLineas(lines: CreditNoteLine[]): void {
    if (lines.length === 0) {
      throw new InvalidCreditNoteError('Una nota de credito necesita al menos una linea de detalle.');
    }
    if (lines.length > CreditNote.MAX_LINES) {
      throw new InvalidCreditNoteError(`Una nota de credito no puede tener mas de ${CreditNote.MAX_LINES} lineas.`);
    }
    const productos = new Set(lines.map((l) => l.productId.value));
    if (productos.size !== lines.length) {
      throw new InvalidCreditNoteError('Un producto no puede repetirse en dos lineas de la misma nota.');
    }
  }

  get id(): CreditNoteId { return this._id; }
  get saleId(): string { return this._saleId; }
  get number(): string { return this._number; }
  get date(): string { return this._date; }
  get hour(): string { return this._hour; }
  get reason(): string { return this._reason; }
  get lines(): readonly CreditNoteLine[] { return this._lines; }

  get subTotal(): Money {
    return Money.fromCentimos(this._lines.reduce((acc, l) => acc + l.partial.centimos, 0));
  }

  get igv(): Money {
    return Money.fromCentimos(Math.round(this.subTotal.centimos * CreditNote.IGV_RATE));
  }

  get total(): Money {
    return Money.fromCentimos(this.subTotal.centimos + this.igv.centimos);
  }

  toSnapshot(): CreditNoteSnapshot {
    return {
      id: this._id.value,
      saleId: this._saleId,
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
