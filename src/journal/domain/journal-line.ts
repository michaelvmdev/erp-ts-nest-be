import { Money } from '../../shared/domain/money.value-object';

export interface JournalLineSnapshot {
  readonly lineNumber: number;
  readonly accountCode: string;
  readonly accountName: string;
  readonly debit: number;
  readonly credit: number;
}

export class JournalLine {
  constructor(
    readonly lineNumber: number,
    readonly accountCode: string,
    readonly accountName: string,
    private readonly _debit: Money,
    private readonly _credit: Money,
  ) {}

  get debit(): Money { return this._debit; }
  get credit(): Money { return this._credit; }

  toSnapshot(): JournalLineSnapshot {
    return {
      lineNumber: this.lineNumber,
      accountCode: this.accountCode,
      accountName: this.accountName,
      debit: this._debit.centimos,
      credit: this._credit.centimos,
    };
  }
}
