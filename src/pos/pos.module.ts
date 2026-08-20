import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PosController } from './infrastructure/http/pos.controller';
import { PosSessionEntity } from './infrastructure/orm/pos-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PosSessionEntity]), AuthModule],
  controllers: [PosController],
})
export class PosModule {}
