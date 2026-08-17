import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'quotes' })
export class QuoteOrmEntity {
  @PrimaryColumn({ name: 'quote_id', type: 'uuid' })
  quoteId!: string;

  @Column({ name: 'quote_number', type: 'varchar', length: 14 })
  quoteNumber!: string;

  @Column({ name: 'status', type: 'varchar', length: 20 })
  status!: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'quote_date', type: 'date' })
  quoteDate!: string;

  @Column({ name: 'valid_until', type: 'date' })
  validUntil!: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'sub_total', type: 'numeric', precision: 12, scale: 2 })
  subTotal!: string;

  @Column({ name: 'igv', type: 'numeric', precision: 12, scale: 2 })
  igv!: string;

  @Column({ name: 'total', type: 'numeric', precision: 12, scale: 2 })
  total!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

@Entity({ name: 'quote_details' })
export class QuoteDetailOrmEntity {
  @PrimaryColumn({ name: 'quote_id', type: 'uuid' })
  quoteId!: string;

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
