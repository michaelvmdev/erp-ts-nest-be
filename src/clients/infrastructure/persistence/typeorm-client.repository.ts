import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentTypeOrmEntity } from '../../../document-types/infrastructure/persistence/document-type.orm-entity';
import { DocumentTypeId } from '../../../document-types/domain/document-type-id.value-object';
import { Page } from '../../../shared/domain/pagination';
import { Client } from '../../domain/client';
import { ClientSearchCriteria } from '../../domain/client-search.criteria';
import {
  ClientRepository,
  DocumentTypeExistenceChecker,
} from '../../domain/client.repository';
import { ClientId } from '../../domain/value-objects/client-id.value-object';
import { ClientMapper } from './client.mapper';
import { ClientOrmEntity } from './client.orm-entity';

@Injectable()
export class TypeOrmClientRepository
  implements ClientRepository, DocumentTypeExistenceChecker
{
  constructor(
    @InjectRepository(ClientOrmEntity)
    private readonly clients: Repository<ClientOrmEntity>,
    @InjectRepository(DocumentTypeOrmEntity)
    private readonly documentTypes: Repository<DocumentTypeOrmEntity>,
  ) {}

  async findById(id: ClientId): Promise<Client | null> {
    const row = await this.clients.findOne({ where: { clientId: id.value } });
    return row ? ClientMapper.toDomain(row) : null;
  }

  async search(criteria: ClientSearchCriteria): Promise<Page<Client>> {
    const qb = this.clients.createQueryBuilder('c');

    if (criteria.description) {
      // El comodin va como parametro, nunca concatenado en el SQL.
      qb.andWhere('c.clientDescription ILIKE :descripcion', {
        descripcion: `%${criteria.description}%`,
      });
    }

    if (criteria.documentNumber) {
      qb.andWhere('c.documentNumber = :documento', {
        documento: criteria.documentNumber,
      });
    }

    if (criteria.documentTypeId) {
      qb.andWhere('c.documentTypeId = :tipo', {
        tipo: criteria.documentTypeId.value,
      });
    }

    if (criteria.active !== null) {
      qb.andWhere('c.clientActive = :activo', { activo: criteria.active });
    }

    const columna =
      criteria.sortBy === 'documentNumber'
        ? 'c.documentNumber'
        : 'c.clientDescription';

    qb.orderBy(columna, criteria.sortDirection)
      // Desempate por clave primaria: sin esto, dos homonimos pueden alternar de
      // pagina entre consultas y el paginado repite o saltea filas.
      .addOrderBy('c.clientId', 'ASC')
      .skip(criteria.page.offset)
      .take(criteria.page.limit);

    const [rows, total] = await qb.getManyAndCount();

    return new Page(
      rows.map((row) => ClientMapper.toDomain(row)),
      total,
      criteria.page.page,
      criteria.page.limit,
    );
  }

  async findByDocumentNumber(
    documentNumber: string,
    excludeId?: ClientId,
  ): Promise<Client | null> {
    const qb = this.clients
      .createQueryBuilder('c')
      .where('c.documentNumber = :documento', { documento: documentNumber });

    if (excludeId) {
      qb.andWhere('c.clientId <> :excluido', { excluido: excludeId.value });
    }

    const row = await qb.getOne();
    return row ? ClientMapper.toDomain(row) : null;
  }

  async insert(client: Client): Promise<void> {
    await this.clients.insert(ClientMapper.toPersistence(client));
  }

  async update(client: Client): Promise<void> {
    await this.clients.save(ClientMapper.toPersistence(client));
  }

  async exists(documentTypeId: DocumentTypeId): Promise<boolean> {
    return this.documentTypes.existsBy({
      documentTypeId: documentTypeId.value,
    });
  }
}
