import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'roles' })
export class RoleOrmEntity {
  @PrimaryColumn({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @Column({ name: 'role_name', type: 'varchar', length: 50 })
  roleName!: string;

  @Column({ name: 'role_description', type: 'varchar', length: 200, nullable: true })
  roleDescription!: string | null;
}
