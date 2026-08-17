import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { DetractionCodeOrmEntity } from './infrastructure/persistence/detraction-code.orm-entity';
import { DetraccionOrmEntity } from './infrastructure/persistence/detraccion.orm-entity';
import { DetraccionesService } from './detracciones.service';
import { DetraccionesController } from './infrastructure/http/detracciones.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([DetractionCodeOrmEntity, DetraccionOrmEntity]),
    AuthModule,
    AuditModule,
  ],
  controllers: [DetraccionesController],
  providers:   [DetraccionesService],
  exports:     [DetraccionesService],
})
export class DetraccionesModule {}
