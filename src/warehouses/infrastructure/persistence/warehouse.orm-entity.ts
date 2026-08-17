import { Column, DeleteDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'warehouses' })
export class WarehouseOrmEntity {
  @PrimaryColumn({ name: 'warehouse_id', type: 'uuid' })
  warehouseId!: string;

  @Column({ name: 'warehouse_code', type: 'varchar', length: 20, unique: true })
  warehouseCode!: string;

  @Column({ name: 'warehouse_description', type: 'varchar', length: 200 })
  warehouseDescription!: string;

  @Column({ name: 'warehouse_active', type: 'boolean', default: true })
  warehouseActive!: boolean;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
