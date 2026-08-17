import { Column, DeleteDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'users' })
export class UserOrmEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @Column({ name: 'user_email', type: 'varchar', length: 200 })
  userEmail!: string;

  @Column({ name: 'user_name', type: 'varchar', length: 200 })
  userName!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 500 })
  passwordHash!: string;

  @Column({ name: 'user_active', type: 'boolean', default: true })
  userActive!: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
