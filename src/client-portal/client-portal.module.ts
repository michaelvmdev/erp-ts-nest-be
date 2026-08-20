import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ClientPortalController } from './infrastructure/http/client-portal.controller';
import { ClientPortalUserEntity } from './infrastructure/orm/client-portal-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClientPortalUserEntity]),
    AuthModule,
  ],
  controllers: [ClientPortalController],
})
export class ClientPortalModule {}
