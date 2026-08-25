import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('cost_centers')
export class CostCenterOrmEntity {
  @PrimaryColumn('uuid') costCenterId!: string;
  @Column({ length: 20, unique: true }) code!: string;
  @Column({ length: 150 }) name!: string;
  @Column({ type: 'uuid', nullable: true }) parentId!: string | null;
  @Column({ default: true }) active!: boolean;
  @CreateDateColumn() createdAt!: Date;
}
