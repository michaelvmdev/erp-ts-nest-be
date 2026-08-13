import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'user_ecommerce' })
export class UserEcommerceOrmEntity {
  @PrimaryColumn({ name: 'user_ecommerce_id', type: 'uuid' })
  userEcommerceId!: string;

  @Column({ name: 'email', type: 'varchar', length: 200, unique: true })
  email!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ name: 'phone', type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ name: 'user_active', type: 'boolean', default: true })
  userActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
