import {
  Column, CreateDateColumn, Entity,
  JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { ProjectEntity } from './project.entity';

@Entity('project_expenses')
export class ProjectExpenseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'expense_id' })
  expenseId!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @ManyToOne(() => ProjectEntity, (p) => p.expenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: ProjectEntity;

  @Column({ length: 300 })
  description!: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount!: string;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  category!: string | null;

  @Column({ name: 'expense_date', type: 'date', default: () => 'CURRENT_DATE' })
  expenseDate!: string;

  @Column({ name: 'created_by', nullable: true, type: 'varchar', length: 200 })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
