import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { GuiaRemisionOrmEntity } from './infrastructure/persistence/guia-remision.orm-entity';
import { GuiasRemisionService } from './guias-remision.service';
import { GuiasRemisionController } from './infrastructure/http/guias-remision.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GuiaRemisionOrmEntity]), AuthModule],
  controllers: [GuiasRemisionController],
  providers:   [GuiasRemisionService],
  exports:     [GuiasRemisionService],
})
export class GuiasRemisionModule {}
