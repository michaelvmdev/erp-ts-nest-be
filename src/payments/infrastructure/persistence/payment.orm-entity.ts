import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { PaymentMethod, PaymentType, ReferenceType } from '../../domain/payment';

@Entity({ name: 'payments' })
export class PaymentOrmEntity {
  @PrimaryColumn({ name: 'payment_id', type: 'uuid' })
  paymentId!: string;

  @Column({ name: 'payment_type', type: 'varchar', length: 20 })
  paymentType!: PaymentType;

  @Column({ name: 'reference_type', type: 'varchar', length: 20 })
  referenceType!: ReferenceType;

  @Column({ name: 'reference_id', type: 'uuid' })
  referenceId!: string;

  @Column({ name: 'payment_date', type: 'date' })
  paymentDate!: string;

  @Column({ name: 'amount', type: 'numeric', precision: 12, scale: 2 })
  amount!: string;

  @Column({ name: 'payment_method', type: 'varchar', length: 30, default: 'cash' })
  paymentMethod!: PaymentMethod;

  @Column({ name: 'notes', type: 'varchar', length: 500, nullable: true })
  notes!: string | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}
