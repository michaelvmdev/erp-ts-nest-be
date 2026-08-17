import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'lots' })
export class LotOrmEntity {
  @PrimaryColumn({ name: 'lot_id', type: 'uuid' })
  lotId!: string;

  @Column({ name: 'lot_number', type: 'varchar', length: 50 })
  lotNumber!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId!: string;

  @Column({ name: 'manufacturing_date', type: 'date', nullable: true })
  manufacturingDate!: string | null;

  @Column({ name: 'expiration_date', type: 'date' })
  expirationDate!: string;

  @Column({ name: 'initial_quantity', type: 'int' })
  initialQuantity!: number;

  @Column({ name: 'current_quantity', type: 'int' })
  currentQuantity!: number;

  @Column({ name: 'status', type: 'varchar', length: 20 })
  status!: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
