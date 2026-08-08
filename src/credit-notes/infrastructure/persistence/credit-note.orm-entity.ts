import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'credit_notes' })
export class CreditNoteOrmEntity {
  @PrimaryColumn({ name: 'credit_note_id', type: 'uuid' })
  creditNoteId!: string;

  @Column({ name: 'sale_id', type: 'uuid' })
  saleId!: string;

  @Column({ name: 'credit_note_number', type: 'varchar', length: 14 })
  creditNoteNumber!: string;

  @Column({ name: 'credit_note_date', type: 'date' })
  creditNoteDate!: string;

  @Column({ name: 'credit_note_hour', type: 'time' })
  creditNoteHour!: string;

  @Column({ name: 'reason', type: 'varchar', length: 500 })
  reason!: string;

  @Column({ name: 'sub_total', type: 'numeric', precision: 12, scale: 2 })
  subTotal!: string;

  @Column({ name: 'igv', type: 'numeric', precision: 12, scale: 2 })
  igv!: string;

  @Column({ name: 'total', type: 'numeric', precision: 12, scale: 2 })
  total!: string;
}

@Entity({ name: 'credit_note_details' })
export class CreditNoteDetailOrmEntity {
  @PrimaryColumn({ name: 'credit_note_id', type: 'uuid' })
  creditNoteId!: string;

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
