import {
  Column, CreateDateColumn, DeleteDateColumn, Entity,
  OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { ProjectTaskEntity } from './project-task.entity';
import { ProjectExpenseEntity } from './project-expense.entity';

@Entity('projects')
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'project_id' })
  projectId!: string;

  @Column({ name: 'project_name', length: 300 })
  projectName!: string;

  @Column({ name: 'client_id', type: 'uuid', nullable: true })
  clientId!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  budget!: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate!: string | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | null;

  @Column({ length: 50, default: 'planning' })
  status!: string;

  @Column({ name: 'created_by', nullable: true, type: 'varchar', length: 200 })
  createdBy!: string | null;

  @OneToMany(() => ProjectTaskEntity, (t) => t.project)
  tasks!: ProjectTaskEntity[];

  @OneToMany(() => ProjectExpenseEntity, (e) => e.project)
  expenses!: ProjectExpenseEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
