import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreatePaymentUseCase } from './application/create-payment.use-case';
import { DeletePaymentUseCase } from './application/delete-payment.use-case';
import { SearchPaymentsUseCase } from './application/search-payments.use-case';
import { PaymentOrmEntity } from './infrastructure/persistence/payment.orm-entity';
import { PAYMENT_REPOSITORY_PROVIDER } from './infrastructure/persistence/typeorm-payment.repository';
import { PaymentsController } from './infrastructure/http/payments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentOrmEntity])],
  controllers: [PaymentsController],
  providers: [
    PAYMENT_REPOSITORY_PROVIDER,
    CreatePaymentUseCase,
    SearchPaymentsUseCase,
    DeletePaymentUseCase,
  ],
})
export class PaymentsModule {}
