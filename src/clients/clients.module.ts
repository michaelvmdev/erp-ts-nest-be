import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentTypeOrmEntity } from '../document-types/infrastructure/persistence/document-type.orm-entity';
import { CreateClientUseCase } from './application/create-client.use-case';
import { DeleteClientUseCase } from './application/delete-client.use-case';
import { FindClientUseCase } from './application/find-client.use-case';
import { SearchClientsUseCase } from './application/search-clients.use-case';
import { UpdateClientUseCase } from './application/update-client.use-case';
import {
  CLIENT_REPOSITORY,
  DOCUMENT_TYPE_EXISTENCE_CHECKER,
} from './domain/client.repository';
import { ClientsController } from './infrastructure/http/clients.controller';
import { ClientOrmEntity } from './infrastructure/persistence/client.orm-entity';
import { TypeOrmClientRepository } from './infrastructure/persistence/typeorm-client.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ClientOrmEntity, DocumentTypeOrmEntity])],
  controllers: [ClientsController],
  providers: [
    TypeOrmClientRepository,
    { provide: CLIENT_REPOSITORY, useExisting: TypeOrmClientRepository },
    // useExisting y no useClass: el mismo adaptador satisface los dos puertos,
    // asi que debe compartirse la instancia en lugar de crear una por token.
    {
      provide: DOCUMENT_TYPE_EXISTENCE_CHECKER,
      useExisting: TypeOrmClientRepository,
    },
    FindClientUseCase,
    SearchClientsUseCase,
    CreateClientUseCase,
    UpdateClientUseCase,
    DeleteClientUseCase,
  ],
  exports: [TypeOrmModule],
})
export class ClientsModule {}
