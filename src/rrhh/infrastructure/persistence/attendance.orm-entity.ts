import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('attendance')
export class AttendanceOrmEntity {
  @PrimaryColumn('uuid') attendanceId!: string;
  @Column('uuid')        employeeId!: string;
  @Column({ type: 'date' }) date!: string;
  @Column({ type: 'time', nullable: true }) checkIn!: string | null;
  @Column({ type: 'time', nullable: true }) checkOut!: string | null;
  @Column('numeric', { precision: 5, scale: 2, default: 0 }) hoursWorked!: string;
  @Column('numeric', { precision: 5, scale: 2, default: 0 }) overtimeHours!: string;
  @Column({ length: 20, default: 'present' }) status!: string;
  @Column({ type: 'text', nullable: true }) notes!: string | null;
  @CreateDateColumn() createdAt!: Date;
}
