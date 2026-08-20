import {
  Column, CreateDateColumn, Entity,
  JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { ProjectEntity } from './project.entity';

@Entity('project_tasks')
export class ProjectTaskEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'task_id' })
  taskId!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @ManyToOne(() => ProjectEntity, (p) => p.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: ProjectEntity;

  @Column({ length: 300 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ nullable: true, type: 'varchar', length: 200 })
  assignee!: string | null;

  @Column({ name: 'estimated_hours', type: 'numeric', precision: 8, scale: 2, default: 0 })
  estimatedHours!: string;

  @Column({ name: 'actual_hours', type: 'numeric', precision: 8, scale: 2, default: 0 })
  actualHours!: string;

  @Column({ length: 50, default: 'todo' })
  status!: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: string | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
