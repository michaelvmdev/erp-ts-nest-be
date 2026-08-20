import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ExchangeRatesController } from './infrastructure/http/exchange-rates.controller';
import { ExchangeRateEntity } from './infrastructure/orm/exchange-rate.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExchangeRateEntity]),
    AuthModule,
  ],
  controllers: [ExchangeRatesController],
  exports: [TypeOrmModule],
})
export class ExchangeRatesModule {}
