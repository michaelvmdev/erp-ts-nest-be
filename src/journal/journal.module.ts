import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { CreateJournalEntryUseCase } from './application/create-journal-entry.use-case';
import { FindJournalEntryUseCase } from './application/find-journal-entry.use-case';
import { SearchJournalEntriesUseCase } from './application/search-journal-entries.use-case';
import { JOURNAL_REPOSITORY } from './domain/journal.repository';
import { JournalEntryOrmEntity } from './infrastructure/persistence/journal-entry.orm-entity';
import { JournalLineOrmEntity } from './infrastructure/persistence/journal-line.orm-entity';
import { TypeOrmJournalRepository } from './infrastructure/persistence/typeorm-journal.repository';
import { JournalController } from './infrastructure/http/journal.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([JournalEntryOrmEntity, JournalLineOrmEntity]),
    AuthModule,
    AuditModule,
  ],
  controllers: [JournalController],
  providers: [
    TypeOrmJournalRepository,
    { provide: JOURNAL_REPOSITORY, useExisting: TypeOrmJournalRepository },
    CreateJournalEntryUseCase,
    FindJournalEntryUseCase,
    SearchJournalEntriesUseCase,
  ],
  exports: [JOURNAL_REPOSITORY],
})
export class JournalModule {}
