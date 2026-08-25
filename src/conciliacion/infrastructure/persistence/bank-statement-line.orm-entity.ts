import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('bank_statement_lines')
export class BankStatementLineOrmEntity {
  @PrimaryColumn('uuid') lineId!: string;
  @Column({ length: 7 })  period!: string;
  @Column({ type: 'date' }) movementDate!: string;
  @Column({ length: 300 }) description!: string;
  @Column('numeric', { precision: 14, scale: 2 }) amount!: string;
  @Column({ length: 100, nullable: true }) reference!: string | null;
  @Column({ type: 'uuid', nullable: true }) treasuryMovementId!: string | null;
  @Column({ length: 20, default: 'unmatched' }) matchStatus!: string;
  @CreateDateColumn() createdAt!: Date;
}
