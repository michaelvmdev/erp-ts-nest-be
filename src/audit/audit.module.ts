import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './infrastructure/http/audit.controller';

@Module({
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
