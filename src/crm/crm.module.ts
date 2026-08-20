import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CrmController } from './infrastructure/http/crm.controller';
import { CrmLeadEntity } from './infrastructure/orm/crm-lead.entity';
import { CrmActivityEntity } from './infrastructure/orm/crm-activity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CrmLeadEntity, CrmActivityEntity]),
    AuthModule,
  ],
  controllers: [CrmController],
})
export class CrmModule {}
