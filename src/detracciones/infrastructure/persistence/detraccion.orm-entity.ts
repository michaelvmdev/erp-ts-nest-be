import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'detracciones' })
export class DetraccionOrmEntity {
  @PrimaryColumn({ name: 'detraccion_id', type: 'uuid' })
  detraccionId!: string;

  @Column({ name: 'sale_id', type: 'uuid' })
  saleId!: string;

  @Column({ name: 'code', type: 'varchar', length: 10 })
  code!: string;

  @Column({ name: 'base_amount', type: 'numeric', precision: 14, scale: 2 })
  baseAmount!: string;

  @Column({ name: 'rate', type: 'numeric', precision: 5, scale: 4 })
  rate!: string;

  @Column({ name: 'amount', type: 'numeric', precision: 14, scale: 2 })
  amount!: string;

  @Column({ name: 'payment_date', type: 'date', nullable: true })
  paymentDate!: string | null;

  @Column({ name: 'payment_number', type: 'varchar', length: 50, nullable: true })
  paymentNumber!: string | null;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'pending' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
