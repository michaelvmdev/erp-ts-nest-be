import { Column, DeleteDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'purchase_returns' })
export class PurchaseReturnOrmEntity {
  @PrimaryColumn({ name: 'purchase_return_id', type: 'uuid' })
  purchaseReturnId!: string;

  @Column({ name: 'purchase_id', type: 'uuid' })
  purchaseId!: string;

  @Column({ name: 'purchase_return_number', type: 'varchar', length: 14 })
  purchaseReturnNumber!: string;

  @Column({ name: 'return_date', type: 'date' })
  returnDate!: string;

  @Column({ name: 'return_hour', type: 'time' })
  returnHour!: string;

  @Column({ name: 'reason', type: 'varchar', length: 500 })
  reason!: string;

  @Column({ name: 'sub_total', type: 'numeric', precision: 12, scale: 2 })
  subTotal!: string;

  @Column({ name: 'igv', type: 'numeric', precision: 12, scale: 2 })
  igv!: string;

  @Column({ name: 'total', type: 'numeric', precision: 12, scale: 2 })
  total!: string;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}

@Entity({ name: 'purchase_return_details' })
export class PurchaseReturnDetailOrmEntity {
  @PrimaryColumn({ name: 'purchase_return_id', type: 'uuid' })
  purchaseReturnId!: string;

  @PrimaryColumn({ name: 'item', type: 'int' })
  item!: number;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'quantity', type: 'int' })
  quantity!: number;

  @Column({ name: 'unit_cost', type: 'numeric', precision: 12, scale: 2 })
  unitCost!: string;

  @Column({ name: 'partial', type: 'numeric', precision: 12, scale: 2 })
  partial!: string;
}
