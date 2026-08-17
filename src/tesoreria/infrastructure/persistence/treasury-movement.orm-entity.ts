import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'treasury_movements' })
export class TreasuryMovementOrmEntity {
  @PrimaryColumn({ name: 'movement_id', type: 'uuid' })
  movementId!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ name: 'type', type: 'varchar', length: 10 })
  type!: string; // income | expense | transfer

  @Column({ name: 'amount', type: 'numeric', precision: 14, scale: 2 })
  amount!: string;

  @Column({ name: 'description', type: 'varchar', length: 300 })
  description!: string;

  @Column({ name: 'reference', type: 'varchar', length: 100, nullable: true })
  reference!: string | null;

  @Column({ name: 'category', type: 'varchar', length: 60, nullable: true })
  category!: string | null;

  @Column({ name: 'movement_date', type: 'date' })
  movementDate!: string;

  @Column({ name: 'related_account_id', type: 'uuid', nullable: true })
  relatedAccountId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
