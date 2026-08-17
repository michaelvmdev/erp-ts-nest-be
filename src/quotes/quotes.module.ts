import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientOrmEntity } from '../clients/infrastructure/persistence/client.orm-entity';
import { ProductOrmEntity } from '../products/infrastructure/persistence/product.orm-entity';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { CreateQuoteUseCase } from './application/create-quote.use-case';
import { FindQuoteUseCase } from './application/find-quote.use-case';
import { SearchQuotesUseCase } from './application/search-quotes.use-case';
import { UpdateQuoteStatusUseCase } from './application/update-quote-status.use-case';
import { QUOTE_CATALOG, QUOTE_REPOSITORY } from './domain/quote.repository';
import { QuoteDetailOrmEntity, QuoteOrmEntity } from './infrastructure/persistence/quote.orm-entity';
import { TypeOrmQuoteRepository } from './infrastructure/persistence/typeorm-quote.repository';
import { QuotesController } from './infrastructure/http/quotes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuoteOrmEntity,
      QuoteDetailOrmEntity,
      ClientOrmEntity,
      ProductOrmEntity,
    ]),
    AuthModule,
    AuditModule,
  ],
  controllers: [QuotesController],
  providers: [
    TypeOrmQuoteRepository,
    { provide: QUOTE_REPOSITORY, useExisting: TypeOrmQuoteRepository },
    { provide: QUOTE_CATALOG,    useExisting: TypeOrmQuoteRepository },
    CreateQuoteUseCase,
    FindQuoteUseCase,
    SearchQuotesUseCase,
    UpdateQuoteStatusUseCase,
  ],
})
export class QuotesModule {}
