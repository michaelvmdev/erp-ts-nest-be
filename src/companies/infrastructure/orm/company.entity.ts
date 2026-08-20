import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('companies')
export class CompanyEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'company_id' })
  companyId: string;

  @Column({ name: 'company_name', length: 300 })
  companyName: string;

  @Column({ nullable: true, length: 20 })
  ruc: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ nullable: true, length: 50 })
  phone: string | null;

  @Column({ nullable: true, length: 200 })
  email: string | null;

  @Column({ nullable: true, length: 300 })
  website: string | null;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ name: 'legal_rep', nullable: true, length: 200 })
  legalRep: string | null;

  @Column({ type: 'char', length: 3, default: 'PEN' })
  currency: string;

  @Column({ name: 'igv_rate', type: 'numeric', precision: 5, scale: 4, default: 0.18 })
  igvRate: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
