import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentType } from '../../domain/document-type';
import { DocumentTypeRepository } from '../../domain/document-type.repository';
import { DocumentTypeMapper } from './document-type.mapper';
import { DocumentTypeOrmEntity } from './document-type.orm-entity';

@Injectable()
export class TypeOrmDocumentTypeRepository implements DocumentTypeRepository {
  constructor(
    @InjectRepository(DocumentTypeOrmEntity)
    private readonly documentTypes: Repository<DocumentTypeOrmEntity>,
  ) {}

  async findAll(): Promise<DocumentType[]> {
    // Se ordena por id y no por descripcion: el orden del catalogo es el que le
    // dio el negocio (primero DNI, despues RUC), no el alfabetico.
    const rows = await this.documentTypes.find({
      order: { documentTypeId: 'ASC' },
    });
    return rows.map((row) => DocumentTypeMapper.toDomain(row));
  }
}
