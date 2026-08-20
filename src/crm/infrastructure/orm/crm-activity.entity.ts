import {
  Column, CreateDateColumn, Entity,
  ManyToOne, PrimaryGeneratedColumn, JoinColumn,
} from 'typeorm';
import { CrmLeadEntity } from './crm-lead.entity';

@Entity('crm_activities')
export class CrmActivityEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'activity_id' })
  activityId: string;

  @Column({ name: 'lead_id', type: 'uuid' })
  leadId: string;

  @ManyToOne(() => CrmLeadEntity, (l) => l.activities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: CrmLeadEntity;

  @Column({ length: 50 })
  type: string;

  @Column({ length: 300 })
  subject: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'activity_date', type: 'timestamptz', default: () => 'now()' })
  activityDate: Date;

  @Column({ default: false })
  completed: boolean;

  @Column({ name: 'created_by', nullable: true, length: 200 })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
