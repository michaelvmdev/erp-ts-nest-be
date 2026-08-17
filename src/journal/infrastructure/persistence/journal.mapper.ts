import { Money } from '../../../shared/domain/money.value-object';
import { JournalEntry, JournalEntryId } from '../../domain/journal-entry';
import { JournalLine } from '../../domain/journal-line';
import { JournalEntryOrmEntity } from './journal-entry.orm-entity';
import { JournalLineOrmEntity } from './journal-line.orm-entity';

export class JournalMapper {
  static toDomain(orm: JournalEntryOrmEntity): JournalEntry {
    const lines = (orm.lines ?? []).map(
      (l) =>
        new JournalLine(
          l.lineNumber,
          l.accountCode,
          l.accountName,
          Money.fromDecimalString(l.debit),
          Money.fromDecimalString(l.credit),
        ),
    );
    return JournalEntry.rehydrate({
      id: JournalEntryId.of(orm.entryId),
      entryNumber: orm.entryNumber,
      entryDate: orm.entryDate,
      description: orm.description,
      referenceType: orm.referenceType,
      referenceId: orm.referenceId,
      lines,
    });
  }

  static toOrm(entry: JournalEntry): JournalEntryOrmEntity {
    const orm = new JournalEntryOrmEntity();
    orm.entryId      = entry.id.value;
    orm.entryNumber  = entry.entryNumber;
    orm.entryDate    = entry.entryDate;
    orm.description  = entry.description;
    orm.referenceType = entry.referenceType;
    orm.referenceId  = entry.referenceId;
    orm.lines        = entry.lines.map((l) => {
      const lo = new JournalLineOrmEntity();
      lo.entryId      = entry.id.value;
      lo.lineNumber   = l.lineNumber;
      lo.accountCode  = l.accountCode;
      lo.accountName  = l.accountName;
      lo.debit        = (l.debit.centimos / 100).toFixed(2);
      lo.credit       = (l.credit.centimos / 100).toFixed(2);
      return lo;
    });
    return orm;
  }
}
