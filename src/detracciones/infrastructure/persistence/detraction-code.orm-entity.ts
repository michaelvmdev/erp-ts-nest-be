import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'detraction_codes' })
export class DetractionCodeOrmEntity {
  @PrimaryColumn({ name: 'code', type: 'varchar', length: 10 })
  code!: string;

  @Column({ name: 'description', type: 'varchar', length: 200 })
  description!: string;

  @Column({ name: 'rate', type: 'numeric', precision: 5, scale: 4 })
  rate!: string;

  @Column({ name: 'active', type: 'boolean', default: true })
  active!: boolean;
}
