import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListDocumentTypesUseCase } from './application/list-document-types.use-case';
import { DOCUMENT_TYPE_REPOSITORY } from './domain/document-type.repository';
import { DocumentTypesController } from './infrastructure/http/document-types.controller';
import { DocumentTypeOrmEntity } from './infrastructure/persistence/document-type.orm-entity';
import { TypeOrmDocumentTypeRepository } from './infrastructure/persistence/typeorm-document-type.repository';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentTypeOrmEntity])],
  controllers: [DocumentTypesController],
  providers: [
    TypeOrmDocumentTypeRepository,
    {
      provide: DOCUMENT_TYPE_REPOSITORY,
      useExisting: TypeOrmDocumentTypeRepository,
    },
    ListDocumentTypesUseCase,
  ],
  // La entidad ORM se exporta para cuando el modulo de clientes necesite
  // validar que un document_type_id existe.
  exports: [TypeOrmModule],
})
export class DocumentTypesModule {}
