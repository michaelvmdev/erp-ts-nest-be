import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TreasuryAccountOrmEntity } from './infrastructure/persistence/treasury-account.orm-entity';
import { TreasuryMovementOrmEntity } from './infrastructure/persistence/treasury-movement.orm-entity';
import { TesoreriaService } from './tesoreria.service';
import { TesoreriaController } from './infrastructure/http/tesoreria.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TreasuryAccountOrmEntity, TreasuryMovementOrmEntity]),
    AuthModule,
    AuditModule,
  ],
  controllers: [TesoreriaController],
  providers:   [TesoreriaService],
  exports:     [TesoreriaService],
})
export class TesoreriaModule {}
