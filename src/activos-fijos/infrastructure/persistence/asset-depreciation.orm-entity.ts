import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'asset_depreciations' })
export class AssetDepreciationOrmEntity {
  @PrimaryColumn({ name: 'depreciation_id', type: 'uuid' })
  depreciationId!: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId!: string;

  @Column({ name: 'period', type: 'varchar', length: 7 })
  period!: string; // YYYY-MM

  @Column({ name: 'amount', type: 'numeric', precision: 14, scale: 2 })
  amount!: string;

  @Column({ name: 'accumulated', type: 'numeric', precision: 14, scale: 2 })
  accumulated!: string;

  @Column({ name: 'book_value', type: 'numeric', precision: 14, scale: 2 })
  bookValue!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
