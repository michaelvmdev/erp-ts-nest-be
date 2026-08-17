import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'employees' })
export class EmployeeOrmEntity {
  @PrimaryColumn({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'code', type: 'varchar', length: 20, unique: true })
  code!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ name: 'document_type', type: 'varchar', length: 10, default: 'DNI' })
  documentType!: string;

  @Column({ name: 'document_number', type: 'varchar', length: 20 })
  documentNumber!: string;

  @Column({ name: 'email', type: 'varchar', length: 200, nullable: true })
  email!: string | null;

  @Column({ name: 'phone', type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ name: 'position', type: 'varchar', length: 100 })
  position!: string;

  @Column({ name: 'department', type: 'varchar', length: 100, nullable: true })
  department!: string | null;

  @Column({ name: 'hire_date', type: 'date' })
  hireDate!: string;

  @Column({ name: 'termination_date', type: 'date', nullable: true })
  terminationDate!: string | null;

  @Column({ name: 'salary', type: 'numeric', precision: 14, scale: 2 })
  salary!: string;

  @Column({ name: 'pension_system', type: 'varchar', length: 10, default: 'AFP' })
  pensionSystem!: string;

  @Column({ name: 'afp_name', type: 'varchar', length: 60, nullable: true })
  afpName!: string | null;

  @Column({ name: 'active', type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
