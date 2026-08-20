import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('exchange_rates')
export class ExchangeRateEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'rate_id' })
  rateId: string;

  @Column({ name: 'currency_from', type: 'char', length: 3 })
  currencyFrom: string;

  @Column({ name: 'currency_to', type: 'char', length: 3 })
  currencyTo: string;

  @Column({ type: 'numeric', precision: 14, scale: 6 })
  rate: string;

  @Column({ name: 'rate_buy', type: 'numeric', precision: 14, scale: 6, nullable: true })
  rateBuy: string | null;

  @Column({ name: 'rate_sell', type: 'numeric', precision: 14, scale: 6, nullable: true })
  rateSell: string | null;

  @Column({ name: 'effective_date', type: 'date' })
  effectiveDate: string;

  @Column({ nullable: true, length: 100, default: 'manual' })
  source: string;

  @Column({ name: 'created_by', nullable: true, length: 200 })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
