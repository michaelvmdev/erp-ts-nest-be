import { Page } from '../../shared/domain/pagination';
import { DocumentTypeId } from '../../document-types/domain/document-type-id.value-object';
import { Client } from './client';
import { ClientSearchCriteria } from './client-search.criteria';
import { ClientId } from './value-objects/client-id.value-object';

export interface ClientRepository {
  findById(id: ClientId): Promise<Client | null>;

  search(criteria: ClientSearchCriteria): Promise<Page<Client>>;

  /**
   * Busca por numero de documento.
   *
   * `excludeId` permite corregir el documento de un cliente sin que choque
   * consigo mismo al validar un PATCH.
   */
  findByDocumentNumber(
    documentNumber: string,
    excludeId?: ClientId,
  ): Promise<Client | null>;

  insert(client: Client): Promise<void>;

  update(client: Client): Promise<void>;

  /**
   * Baja fisica.
   *
   * Lanza ClientInUseError si el cliente figura en ventas registradas: la
   * decision de traducir la violacion de clave foranea a un error de dominio es
   * del adaptador, porque solo el conoce los codigos de error de PostgreSQL.
   */
  delete(id: ClientId): Promise<void>;
}

/**
 * Puerto para comprobar que un tipo de documento existe antes de asociarlo.
 *
 * Va aparte del repositorio de clientes porque Tipo de documento es otro
 * agregado. Este puerto expresa lo unico que el dominio de clientes necesita
 * saber de el, y nada mas.
 */
export interface DocumentTypeExistenceChecker {
  exists(documentTypeId: DocumentTypeId): Promise<boolean>;
}

export const CLIENT_REPOSITORY = Symbol('ClientRepository');
export const DOCUMENT_TYPE_EXISTENCE_CHECKER = Symbol(
  'DocumentTypeExistenceChecker',
);
