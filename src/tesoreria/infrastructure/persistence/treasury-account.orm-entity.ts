import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'treasury_accounts' })
export class TreasuryAccountOrmEntity {
  @PrimaryColumn({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'type', type: 'varchar', length: 20 })
  type!: string; // cash | bank

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'PEN' })
  currency!: string;

  @Column({ name: 'bank_name', type: 'varchar', length: 100, nullable: true })
  bankName!: string | null;

  @Column({ name: 'account_number', type: 'varchar', length: 50, nullable: true })
  accountNumber!: string | null;

  @Column({ name: 'initial_balance', type: 'numeric', precision: 14, scale: 2, default: 0 })
  initialBalance!: string;

  @Column({ name: 'active', type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
