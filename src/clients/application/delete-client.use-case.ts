import { Inject, Injectable } from '@nestjs/common';
import { ClientNotFoundError } from '../domain/client.errors';
import { CLIENT_REPOSITORY } from '../domain/client.repository';
import type { ClientRepository } from '../domain/client.repository';
import { ClientId } from '../domain/value-objects/client-id.value-object';

@Injectable()
export class DeleteClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clients: ClientRepository,
  ) {}

  async execute(rawClientId: string): Promise<void> {
    const id = ClientId.of(rawClientId);

    // Se consulta antes de borrar para distinguir 404 ("no existe") de 204
    // ("existia y se borro"). Sin esta lectura, un DELETE sobre un id inexistente
    // devolveria 204 y el cliente creeria que borro algo.
    const client = await this.clients.findById(id);
    if (!client) {
      throw new ClientNotFoundError(id.value);
    }

    // Si el cliente figura en ventas, el adaptador traduce la violacion de
    // clave foranea a ClientInUseError y el filtro responde 409.
    await this.clients.delete(id);
  }
}
