import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'payroll_lines' })
export class PayrollLineOrmEntity {
  @PrimaryColumn({ name: 'line_id', type: 'uuid' })
  lineId!: string;

  @Column({ name: 'payroll_id', type: 'uuid' })
  payrollId!: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'basic_salary', type: 'numeric', precision: 14, scale: 2 })
  basicSalary!: string;

  @Column({ name: 'family_allowance', type: 'numeric', precision: 14, scale: 2, default: 0 })
  familyAllowance!: string;

  @Column({ name: 'overtime', type: 'numeric', precision: 14, scale: 2, default: 0 })
  overtime!: string;

  @Column({ name: 'gross_salary', type: 'numeric', precision: 14, scale: 2 })
  grossSalary!: string;

  @Column({ name: 'pension_deduction', type: 'numeric', precision: 14, scale: 2, default: 0 })
  pensionDeduction!: string;

  @Column({ name: 'essalud', type: 'numeric', precision: 14, scale: 2, default: 0 })
  essalud!: string;

  @Column({ name: 'income_tax', type: 'numeric', precision: 14, scale: 2, default: 0 })
  incomeTax!: string;

  @Column({ name: 'other_deductions', type: 'numeric', precision: 14, scale: 2, default: 0 })
  otherDeductions!: string;

  @Column({ name: 'total_deductions', type: 'numeric', precision: 14, scale: 2 })
  totalDeductions!: string;

  @Column({ name: 'net_salary', type: 'numeric', precision: 14, scale: 2 })
  netSalary!: string;

  @Column({ name: 'cts_provision', type: 'numeric', precision: 14, scale: 2, default: 0 })
  ctsProvision!: string;

  @Column({ name: 'gratification_prov', type: 'numeric', precision: 14, scale: 2, default: 0 })
  gratificationProv!: string;

  @Column({ name: 'days_worked', type: 'int', default: 30 })
  daysWorked!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
