import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pos_sessions')
export class PosSessionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'session_id' })
  sessionId!: string;

  @Column({ name: 'cashier_email', length: 200 })
  cashierEmail!: string;

  @Column({ name: 'cashier_name', nullable: true, type: 'varchar', length: 200 })
  cashierName!: string | null;

  @Column({ name: 'opening_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  openingAmount!: string;

  @Column({ name: 'closing_amount', type: 'numeric', precision: 14, scale: 2, nullable: true })
  closingAmount!: string | null;

  @Column({ name: 'total_sales', type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalSales!: string;

  @Column({ name: 'sales_count', type: 'int', default: 0 })
  salesCount!: number;

  @Column({ length: 20, default: 'open' })
  status!: string;

  @Column({ name: 'opened_at', type: 'timestamptz', default: () => 'now()' })
  openedAt!: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
