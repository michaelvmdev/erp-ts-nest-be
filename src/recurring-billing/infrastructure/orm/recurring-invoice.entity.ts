import {
  Column, CreateDateColumn, Entity, OneToMany,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { RecurringInvoiceItemEntity } from './recurring-invoice-item.entity';

@Entity('recurring_invoices')
export class RecurringInvoiceEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'recurring_id' })
  recurringId!: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ length: 300 })
  description!: string;

  @Column({ length: 50 })
  frequency!: string;

  @Column({ name: 'next_billing_date', type: 'date' })
  nextBillingDate!: string;

  @Column({ name: 'last_billed_date', type: 'date', nullable: true })
  lastBilledDate!: string | null;

  @Column({ name: 'sub_total', type: 'numeric', precision: 14, scale: 2, default: 0 })
  subTotal!: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  igv!: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total!: string;

  @Column({ length: 50, default: 'active' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'created_by', nullable: true, type: 'varchar', length: 200 })
  createdBy!: string | null;

  @OneToMany(() => RecurringInvoiceItemEntity, (i) => i.recurringInvoice)
  items!: RecurringInvoiceItemEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
