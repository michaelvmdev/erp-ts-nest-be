import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('retenciones')
export class RetencionOrmEntity {
  @PrimaryColumn('uuid') retencionId!: string;
  @Column('uuid')        purchaseId!: string;
  @Column('uuid')        supplierId!: string;
  @Column('numeric', { precision: 14, scale: 2 }) baseAmount!: string;
  @Column('numeric', { precision: 14, scale: 2 }) retencionAmount!: string;
  @Column({ length: 7 }) period!: string;
  @Column({ length: 20, default: 'pending' }) status!: string;
  @Column({ type: 'text', nullable: true }) notes!: string | null;
  @Column({ type: 'timestamptz', nullable: true }) paidAt!: Date | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
