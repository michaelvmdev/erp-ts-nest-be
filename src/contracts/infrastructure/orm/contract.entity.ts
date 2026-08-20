import {
  Column, CreateDateColumn, DeleteDateColumn, Entity,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('contracts')
export class ContractEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'contract_id' })
  contractId!: string;

  @Column({ name: 'contract_number', length: 100, unique: true })
  contractNumber!: string;

  @Column({ length: 300 })
  title!: string;

  @Column({ length: 50 })
  type!: string;

  @Column({ name: 'client_id', type: 'uuid', nullable: true })
  clientId!: string | null;

  @Column({ name: 'supplier_id', type: 'uuid', nullable: true })
  supplierId!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  value!: string;

  @Column({ type: 'char', length: 3, default: 'PEN' })
  currency!: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | null;

  @Column({ name: 'renewal_date', type: 'date', nullable: true })
  renewalDate!: string | null;

  @Column({ length: 50, default: 'draft' })
  status!: string;

  @Column({ name: 'auto_renew', default: false })
  autoRenew!: boolean;

  @Column({ name: 'alert_days', type: 'int', default: 30 })
  alertDays!: number;

  @Column({ name: 'file_url', type: 'text', nullable: true })
  fileUrl!: string | null;

  @Column({ name: 'created_by', nullable: true, type: 'varchar', length: 200 })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
