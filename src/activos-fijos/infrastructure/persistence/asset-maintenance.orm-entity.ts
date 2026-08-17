import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'asset_maintenances' })
export class AssetMaintenanceOrmEntity {
  @PrimaryColumn({ name: 'maintenance_id', type: 'uuid' })
  maintenanceId!: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId!: string;

  @Column({ name: 'maintenance_date', type: 'date' })
  maintenanceDate!: string;

  @Column({ name: 'type', type: 'varchar', length: 20 })
  type!: string; // preventive | corrective

  @Column({ name: 'description', type: 'text' })
  description!: string;

  @Column({ name: 'cost', type: 'numeric', precision: 14, scale: 2, default: 0 })
  cost!: string;

  @Column({ name: 'provider', type: 'varchar', length: 100, nullable: true })
  provider!: string | null;

  @Column({ name: 'next_maintenance', type: 'date', nullable: true })
  nextMaintenance!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
