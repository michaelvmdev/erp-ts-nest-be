import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { PurchaseOrderStatus } from '../../domain/purchase-order';

@Entity({ name: 'purchase_orders' })
export class PurchaseOrderOrmEntity {
  @PrimaryColumn({ name: 'purchase_order_id', type: 'uuid' })
  purchaseOrderId!: string;

  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId!: string;

  @Column({ name: 'purchase_order_date', type: 'date' })
  purchaseOrderDate!: string;

  @Column({ name: 'purchase_order_status', type: 'varchar', length: 20 })
  purchaseOrderStatus!: PurchaseOrderStatus;

  @Column({ name: 'sub_total', type: 'numeric', precision: 12, scale: 2 })
  subTotal!: string;

  @Column({ name: 'igv', type: 'numeric', precision: 12, scale: 2 })
  igv!: string;

  @Column({ name: 'total', type: 'numeric', precision: 12, scale: 2 })
  total!: string;

  @Column({ name: 'notes', type: 'varchar', length: 500, nullable: true })
  notes!: string | null;
}

@Entity({ name: 'purchase_order_details' })
export class PurchaseOrderDetailOrmEntity {
  @PrimaryColumn({ name: 'purchase_order_id', type: 'uuid' })
  purchaseOrderId!: string;

  @PrimaryColumn({ name: 'item', type: 'int' })
  item!: number;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'quantity_ordered', type: 'numeric', precision: 12, scale: 4 })
  quantityOrdered!: string;

  @Column({ name: 'quantity_received', type: 'numeric', precision: 12, scale: 4 })
  quantityReceived!: string;

  @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 2 })
  unitPrice!: string;

  @Column({ name: 'partial', type: 'numeric', precision: 12, scale: 2 })
  partial!: string;
}
