import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RecurringBillingController } from './infrastructure/http/recurring-billing.controller';
import { RecurringInvoiceEntity } from './infrastructure/orm/recurring-invoice.entity';
import { RecurringInvoiceItemEntity } from './infrastructure/orm/recurring-invoice-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecurringInvoiceEntity, RecurringInvoiceItemEntity]),
    AuthModule,
  ],
  controllers: [RecurringBillingController],
})
export class RecurringBillingModule {}
