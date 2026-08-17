import { Column, DeleteDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'clients' })
export class ClientOrmEntity {
  @PrimaryColumn({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'client_description', type: 'varchar', length: 100 })
  clientDescription!: string;

  @Column({ name: 'document_type_id', type: 'int' })
  documentTypeId!: number;

  @Column({ name: 'document_number', type: 'varchar', length: 11 })
  documentNumber!: string;

  @Column({ name: 'client_active', type: 'boolean', default: true })
  clientActive!: boolean;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
