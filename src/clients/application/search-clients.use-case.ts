import { Inject, Injectable } from '@nestjs/common';
import { Page } from '../../shared/domain/pagination';
import { DocumentTypeId } from '../../document-types/domain/document-type-id.value-object';
import { Client } from '../domain/client';
import { ClientSearchCriteria } from '../domain/client-search.criteria';
import { CLIENT_REPOSITORY } from '../domain/client.repository';
import type { ClientRepository } from '../domain/client.repository';
import { SearchClientsQuery } from './client.commands';

@Injectable()
export class SearchClientsUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clients: ClientRepository,
  ) {}

  async execute(query: SearchClientsQuery): Promise<Page<Client>> {
    const criteria = ClientSearchCriteria.of({
      description: query.clientDescription,
      documentNumber: query.documentNumber,
      documentTypeId:
        query.documentTypeId != null
          ? DocumentTypeId.of(query.documentTypeId)
          : null,
      active: query.clientActive ?? null,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return this.clients.search(criteria);
  }
}
