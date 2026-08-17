import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'webhooks' })
export class WebhookOrmEntity {
  @PrimaryColumn({ name: 'webhook_id', type: 'uuid' })
  webhookId!: string;

  @Column({ name: 'url', type: 'varchar', length: 500 })
  url!: string;

  @Column({ name: 'events', type: 'jsonb' })
  events!: string[];

  @Column({ name: 'secret', type: 'varchar', length: 200, nullable: true })
  secret!: string | null;

  @Column({ name: 'active', type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
