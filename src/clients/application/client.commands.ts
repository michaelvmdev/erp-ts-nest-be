/**
 * Contratos de entrada de la capa de aplicacion, en tipos planos: los casos de
 * uso no dependen de las clases de request HTTP.
 */

export interface CreateClientCommand {
  readonly clientDescription: string;
  readonly documentTypeId: number;
  readonly documentNumber: string;
  readonly clientActive?: boolean;
}

export interface UpdateClientCommand {
  readonly clientDescription?: string;
  readonly documentTypeId?: number;
  readonly documentNumber?: string;
  readonly clientActive?: boolean;
}

export interface SearchClientsQuery {
  readonly clientDescription?: string | null;
  readonly documentNumber?: string | null;
  readonly documentTypeId?: number | null;
  readonly clientActive?: boolean | null;
  readonly sortBy?: 'description' | 'documentNumber';
  readonly sortDirection?: 'ASC' | 'DESC';
  readonly page?: number;
  readonly limit?: number;
}
