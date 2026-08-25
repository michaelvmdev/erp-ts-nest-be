import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RetencionOrmEntity } from './infrastructure/persistence/retencion.orm-entity';
import { RetencionesService } from './retenciones.service';
import { RetencionesController } from './infrastructure/http/retenciones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RetencionOrmEntity]), AuthModule],
  controllers: [RetencionesController],
  providers:   [RetencionesService],
  exports:     [RetencionesService],
})
export class RetencionesModule {}
