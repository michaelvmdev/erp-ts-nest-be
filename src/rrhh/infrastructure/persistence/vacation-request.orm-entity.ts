import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('vacation_requests')
export class VacationRequestOrmEntity {
  @PrimaryColumn('uuid') requestId!: string;
  @Column('uuid')        employeeId!: string;
  @Column({ type: 'date' }) startDate!: string;
  @Column({ type: 'date' }) endDate!: string;
  @Column('int')         days!: number;
  @Column({ length: 20, default: 'pending' }) status!: string;
  @Column({ type: 'text', nullable: true }) reason!: string | null;
  @Column({ length: 200, nullable: true }) approvedBy!: string | null;
  @Column({ type: 'timestamptz', nullable: true }) approvedAt!: Date | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
