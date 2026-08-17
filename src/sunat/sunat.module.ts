import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SunatController } from './infrastructure/http/sunat.controller';

@Module({
  imports: [AuthModule],
  controllers: [SunatController],
})
export class SunatModule {}
