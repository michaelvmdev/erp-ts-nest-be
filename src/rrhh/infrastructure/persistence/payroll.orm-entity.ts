import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'payrolls' })
export class PayrollOrmEntity {
  @PrimaryColumn({ name: 'payroll_id', type: 'uuid' })
  payrollId!: string;

  @Column({ name: 'period', type: 'varchar', length: 7, unique: true })
  period!: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'draft' })
  status!: string;

  @Column({ name: 'total_gross', type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalGross!: string;

  @Column({ name: 'total_deductions', type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalDeductions!: string;

  @Column({ name: 'total_net', type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalNet!: string;

  @Column({ name: 'approved_by', type: 'varchar', length: 200, nullable: true })
  approvedBy!: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
