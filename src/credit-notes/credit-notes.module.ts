import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesModule } from '../sales/sales.module';
import { CreateCreditNoteUseCase } from './application/create-credit-note.use-case';
import { FindCreditNoteUseCase } from './application/find-credit-note.use-case';
import { SearchCreditNotesUseCase } from './application/search-credit-notes.use-case';
import { CREDIT_NOTE_CATALOG, CREDIT_NOTE_REPOSITORY } from './domain/credit-note.repository';
import { CreditNotesController } from './infrastructure/http/credit-notes.controller';
import {
  CreditNoteDetailOrmEntity,
  CreditNoteOrmEntity,
} from './infrastructure/persistence/credit-note.orm-entity';
import { TypeOrmCreditNoteRepository } from './infrastructure/persistence/typeorm-credit-note.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([CreditNoteOrmEntity, CreditNoteDetailOrmEntity]),
    // Importa SalesModule para acceder a SaleOrmEntity y SaleDetailOrmEntity
    // que el adaptador necesita para resolver precios de la venta original.
    SalesModule,
  ],
  controllers: [CreditNotesController],
  providers: [
    TypeOrmCreditNoteRepository,
    { provide: CREDIT_NOTE_REPOSITORY, useExisting: TypeOrmCreditNoteRepository },
    { provide: CREDIT_NOTE_CATALOG, useExisting: TypeOrmCreditNoteRepository },
    CreateCreditNoteUseCase,
    FindCreditNoteUseCase,
    SearchCreditNotesUseCase,
  ],
})
export class CreditNotesModule {}
