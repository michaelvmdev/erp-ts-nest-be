import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'notifications' })
export class NotificationOrmEntity {
  @PrimaryColumn({ name: 'notification_id', type: 'uuid' })
  notificationId!: string;

  @Column({ name: 'user_email', type: 'varchar', length: 200 })
  userEmail!: string;

  @Column({ name: 'type', type: 'varchar', length: 60 })
  type!: string;

  @Column({ name: 'title', type: 'varchar', length: 200 })
  title!: string;

  @Column({ name: 'body', type: 'text' })
  body!: string;

  @Column({ name: 'read', type: 'boolean', default: false })
  read!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
