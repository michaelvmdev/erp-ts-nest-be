import { Column, DeleteDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'units' })
export class UnitOrmEntity {
  @PrimaryColumn({ name: 'unit_id', type: 'uuid' })
  unitId!: string;

  @Column({ name: 'unit_code', type: 'varchar', length: 10, unique: true })
  unitCode!: string;

  @Column({ name: 'unit_description', type: 'varchar', length: 100 })
  unitDescription!: string;

  @Column({ name: 'unit_active', type: 'boolean', default: true })
  unitActive!: boolean;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
