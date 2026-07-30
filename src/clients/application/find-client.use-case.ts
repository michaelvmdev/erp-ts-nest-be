import { Inject, Injectable } from '@nestjs/common';
import { Client } from '../domain/client';
import { ClientNotFoundError } from '../domain/client.errors';
import { CLIENT_REPOSITORY } from '../domain/client.repository';
import type { ClientRepository } from '../domain/client.repository';
import { ClientId } from '../domain/value-objects/client-id.value-object';

@Injectable()
export class FindClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clients: ClientRepository,
  ) {}

  async execute(rawClientId: string): Promise<Client> {
    const id = ClientId.of(rawClientId);

    const client = await this.clients.findById(id);
    if (!client) {
      throw new ClientNotFoundError(id.value);
    }
    return client;
  }
}
