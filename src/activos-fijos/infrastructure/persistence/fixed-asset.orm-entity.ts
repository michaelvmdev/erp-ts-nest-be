import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'fixed_assets' })
export class FixedAssetOrmEntity {
  @PrimaryColumn({ name: 'asset_id', type: 'uuid' })
  assetId!: string;

  @Column({ name: 'code', type: 'varchar', length: 30, unique: true })
  code!: string;

  @Column({ name: 'name', type: 'varchar', length: 200 })
  name!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'category', type: 'varchar', length: 60 })
  category!: string;

  @Column({ name: 'acquisition_date', type: 'date' })
  acquisitionDate!: string;

  @Column({ name: 'acquisition_cost', type: 'numeric', precision: 14, scale: 2 })
  acquisitionCost!: string;

  @Column({ name: 'residual_value', type: 'numeric', precision: 14, scale: 2, default: 0 })
  residualValue!: string;

  @Column({ name: 'useful_life_years', type: 'int' })
  usefulLifeYears!: number;

  @Column({ name: 'depreciation_method', type: 'varchar', length: 20, default: 'linear' })
  depreciationMethod!: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @Column({ name: 'location', type: 'varchar', length: 100, nullable: true })
  location!: string | null;

  @Column({ name: 'serial_number', type: 'varchar', length: 100, nullable: true })
  serialNumber!: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
