import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { JournalEntryOrmEntity } from './journal-entry.orm-entity';

@Entity({ name: 'journal_lines' })
export class JournalLineOrmEntity {
  @PrimaryColumn({ name: 'entry_id', type: 'uuid' })
  entryId!: string;

  @PrimaryColumn({ name: 'line_number', type: 'int' })
  lineNumber!: number;

  @Column({ name: 'account_code', type: 'varchar', length: 15 })
  accountCode!: string;

  @Column({ name: 'account_name', type: 'varchar', length: 200 })
  accountName!: string;

  @Column({ name: 'debit', type: 'numeric', precision: 14, scale: 2 })
  debit!: string;

  @Column({ name: 'credit', type: 'numeric', precision: 14, scale: 2 })
  credit!: string;

  @ManyToOne(() => JournalEntryOrmEntity, (e) => e.lines)
  @JoinColumn({ name: 'entry_id' })
  entry!: JournalEntryOrmEntity;
}
