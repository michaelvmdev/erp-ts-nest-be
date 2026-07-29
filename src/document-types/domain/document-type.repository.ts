import { DocumentType } from './document-type';

/**
 * Puerto de salida del agregado Tipo de documento.
 *
 * Una sola operacion, y sin paginado: el catalogo tiene dos filas y no esta
 * pensado para crecer mas alla de un punado (carnet de extranjeria, pasaporte).
 * Devolver la lista completa es lo que necesita el cliente para poblar un
 * desplegable, y agregar paginado seria complicar el contrato sin motivo.
 */
export interface DocumentTypeRepository {
  findAll(): Promise<DocumentType[]>;
}

export const DOCUMENT_TYPE_REPOSITORY = Symbol('DocumentTypeRepository');
