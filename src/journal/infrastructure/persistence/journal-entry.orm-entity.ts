import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import type { JournalReferenceType } from '../../domain/journal-entry';
import { JournalLineOrmEntity } from './journal-line.orm-entity';

@Entity({ name: 'journal_entries' })
export class JournalEntryOrmEntity {
  @PrimaryColumn({ name: 'entry_id', type: 'uuid' })
  entryId!: string;

  @Column({ name: 'entry_number', type: 'varchar', length: 20, unique: true })
  entryNumber!: string;

  @Column({ name: 'entry_date', type: 'date' })
  entryDate!: string;

  @Column({ name: 'description', type: 'varchar', length: 500 })
  description!: string;

  @Column({ name: 'reference_type', type: 'varchar', length: 30 })
  referenceType!: JournalReferenceType;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => JournalLineOrmEntity, (l) => l.entry, { cascade: ['insert'], eager: false })
  lines!: JournalLineOrmEntity[];
}
