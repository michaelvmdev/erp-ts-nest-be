import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'attachments' })
export class AttachmentOrmEntity {
  @PrimaryColumn({ name: 'attachment_id', type: 'uuid' })
  attachmentId!: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 60 })
  entityType!: string;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId!: string;

  @Column({ name: 'original_name', type: 'varchar', length: 500 })
  originalName!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 200 })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'int' })
  sizeBytes!: number;

  @Column({ name: 'storage_path', type: 'varchar', length: 1000 })
  storagePath!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
