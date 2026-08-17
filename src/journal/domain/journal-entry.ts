import { Money } from '../../shared/domain/money.value-object';
import { InvalidJournalEntryError } from './journal.errors';
import { JournalLine, JournalLineSnapshot } from './journal-line';

export type JournalReferenceType =
  | 'sale'
  | 'purchase'
  | 'purchase_return'
  | 'credit_note'
  | 'manual';

export class JournalEntryId {
  private constructor(readonly value: string) {}
  static of(v: string): JournalEntryId { return new JournalEntryId(v); }
}

export interface JournalEntrySnapshot {
  readonly id: string;
  readonly entryNumber: string;
  readonly entryDate: string;
  readonly description: string;
  readonly referenceType: JournalReferenceType;
  readonly referenceId: string | null;
  readonly lines: readonly JournalLineSnapshot[];
}

export class JournalEntry {
  private constructor(
    private readonly _id: JournalEntryId,
    private readonly _entryNumber: string,
    private readonly _entryDate: string,
    private readonly _description: string,
    private readonly _referenceType: JournalReferenceType,
    private readonly _referenceId: string | null,
    private readonly _lines: JournalLine[],
  ) {}

  static create(params: {
    id: JournalEntryId;
    entryNumber: string;
    entryDate: string;
    description: string;
    referenceType: JournalReferenceType;
    referenceId?: string | null;
    lines: JournalLine[];
  }): JournalEntry {
    JournalEntry.validate(params.lines);
    return new JournalEntry(
      params.id,
      params.entryNumber,
      params.entryDate,
      params.description.trim(),
      params.referenceType,
      params.referenceId ?? null,
      [...params.lines],
    );
  }

  static rehydrate(params: {
    id: JournalEntryId;
    entryNumber: string;
    entryDate: string;
    description: string;
    referenceType: JournalReferenceType;
    referenceId: string | null;
    lines: JournalLine[];
  }): JournalEntry {
    return new JournalEntry(
      params.id,
      params.entryNumber,
      params.entryDate,
      params.description,
      params.referenceType,
      params.referenceId,
      [...params.lines],
    );
  }

  private static validate(lines: JournalLine[]): void {
    if (lines.length < 2) {
      throw new InvalidJournalEntryError(
        'Un asiento necesita al menos dos líneas (partida doble).',
      );
    }
    const sumDebit  = lines.reduce((s, l) => s + l.debit.centimos, 0);
    const sumCredit = lines.reduce((s, l) => s + l.credit.centimos, 0);
    if (sumDebit !== sumCredit) {
      throw new InvalidJournalEntryError(
        `El asiento no cuadra: débitos ${sumDebit} ≠ créditos ${sumCredit} (en centimos).`,
      );
    }
    if (sumDebit === 0) {
      throw new InvalidJournalEntryError('El asiento no puede tener importe cero.');
    }
  }

  get id(): JournalEntryId { return this._id; }
  get entryNumber(): string { return this._entryNumber; }
  get entryDate(): string { return this._entryDate; }
  get description(): string { return this._description; }
  get referenceType(): JournalReferenceType { return this._referenceType; }
  get referenceId(): string | null { return this._referenceId; }
  get lines(): readonly JournalLine[] { return this._lines; }

  get totalDebit(): Money {
    return Money.fromCentimos(this._lines.reduce((s, l) => s + l.debit.centimos, 0));
  }

  get totalCredit(): Money {
    return Money.fromCentimos(this._lines.reduce((s, l) => s + l.credit.centimos, 0));
  }

  toSnapshot(): JournalEntrySnapshot {
    return {
      id: this._id.value,
      entryNumber: this._entryNumber,
      entryDate: this._entryDate,
      description: this._description,
      referenceType: this._referenceType,
      referenceId: this._referenceId,
      lines: this._lines.map((l) => l.toSnapshot()),
    };
  }
}
