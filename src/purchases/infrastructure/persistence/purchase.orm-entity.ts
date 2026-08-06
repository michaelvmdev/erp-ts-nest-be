import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'purchases' })
export class PurchaseOrmEntity {
  @PrimaryColumn({ name: 'purchase_id', type: 'uuid' })
  purchaseId!: string;

  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId!: string;

  /**
   * `date` y `time` se declaran como string y no como Date, igual que en
   * ventas: con Date el driver interpretaria la fecha en la zona del servidor y
   * una compra del 1 de enero podria leerse como 31 de diciembre.
   */
  @Column({ name: 'purchase_date', type: 'date' })
  purchaseDate!: string;

  @Column({ name: 'purchase_hour', type: 'time' })
  purchaseHour!: string;

  // numeric como string: el driver los devuelve asi para no perder precision al
  // pasarlos por un double.
  @Column({ name: 'sub_total', type: 'numeric', precision: 12, scale: 2 })
  subTotal!: string;

  @Column({ name: 'igv', type: 'numeric', precision: 12, scale: 2 })
  igv!: string;

  @Column({ name: 'total', type: 'numeric', precision: 12, scale: 2 })
  total!: string;
}

@Entity({ name: 'purchase_details' })
export class PurchaseDetailOrmEntity {
  // Clave primaria compuesta: la linea se identifica por su compra y su numero
  // de item, no por un id propio.
  @PrimaryColumn({ name: 'purchase_id', type: 'uuid' })
  purchaseId!: string;

  @PrimaryColumn({ name: 'item', type: 'int' })
  item!: number;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'quantity', type: 'int' })
  quantity!: number;

  @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 2 })
  unitPrice!: string;

  @Column({ name: 'partial', type: 'numeric', precision: 12, scale: 2 })
  partial!: string;
}
