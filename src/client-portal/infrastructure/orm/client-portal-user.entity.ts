import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('client_portal_users')
export class ClientPortalUserEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'portal_user_id' })
  portalUserId: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({ length: 200, unique: true })
  email: string;

  @Column({ name: 'password_hash', length: 200 })
  passwordHash: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
