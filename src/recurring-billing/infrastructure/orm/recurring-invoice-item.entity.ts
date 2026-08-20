import {
  Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { RecurringInvoiceEntity } from './recurring-invoice.entity';

@Entity('recurring_invoice_items')
export class RecurringInvoiceItemEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'item_id' })
  itemId: string;

  @Column({ name: 'recurring_id', type: 'uuid' })
  recurringId: string;

  @ManyToOne(() => RecurringInvoiceEntity, (r) => r.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recurring_id' })
  recurringInvoice: RecurringInvoiceEntity;

  @Column({ length: 300 })
  description: string;

  @Column({ type: 'numeric', precision: 12, scale: 4, default: 1 })
  quantity: string;

  @Column({ name: 'unit_price', type: 'numeric', precision: 14, scale: 6 })
  unitPrice: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  subtotal: string;
}
