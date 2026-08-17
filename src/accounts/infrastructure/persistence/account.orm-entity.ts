import { Column, DeleteDateColumn, Entity, PrimaryColumn } from 'typeorm';
import type { AccountType } from '../../domain/account';

@Entity({ name: 'accounts' })
export class AccountOrmEntity {
  @PrimaryColumn({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ name: 'code', type: 'varchar', length: 10, unique: true })
  code!: string;

  @Column({ name: 'name', type: 'varchar', length: 150 })
  name!: string;

  @Column({ name: 'type', type: 'varchar', length: 20 })
  type!: AccountType;

  @Column({ name: 'parent_code', type: 'varchar', length: 10, nullable: true })
  parentCode!: string | null;

  @Column({ name: 'active', type: 'boolean', default: true })
  active!: boolean;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
