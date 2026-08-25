import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CuentasCobrarService } from './cuentas-cobrar.service';
import { CuentasCobrarController } from './infrastructure/http/cuentas-cobrar.controller';

@Module({
  imports: [AuthModule],
  controllers: [CuentasCobrarController],
  providers:   [CuentasCobrarService],
  exports:     [CuentasCobrarService],
})
export class CuentasCobrarModule {}
