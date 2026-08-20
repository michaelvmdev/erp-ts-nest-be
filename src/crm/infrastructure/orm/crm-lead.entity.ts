import {
  Column, CreateDateColumn, DeleteDateColumn, Entity,
  OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { CrmActivityEntity } from './crm-activity.entity';

@Entity('crm_leads')
export class CrmLeadEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'lead_id' })
  leadId: string;

  @Column({ name: 'full_name', length: 200 })
  fullName: string;

  @Column({ nullable: true, length: 200 })
  company: string | null;

  @Column({ nullable: true, length: 200 })
  email: string | null;

  @Column({ nullable: true, length: 50 })
  phone: string | null;

  @Column({ nullable: true, length: 100 })
  source: string | null;

  @Column({ length: 50, default: 'new' })
  status: string;

  @Column({ name: 'estimated_value', type: 'numeric', precision: 14, scale: 2, default: 0 })
  estimatedValue: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'assigned_to', nullable: true, length: 200 })
  assignedTo: string | null;

  @Column({ name: 'client_id', nullable: true, type: 'uuid' })
  clientId: string | null;

  @OneToMany(() => CrmActivityEntity, (a) => a.lead)
  activities: CrmActivityEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
