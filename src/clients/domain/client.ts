import { ClientDescription } from './value-objects/client-description.value-object';
import { ClientDocument } from './value-objects/client-document.value-object';
import { ClientId } from './value-objects/client-id.value-object';

export interface ClientSnapshot {
  readonly id: string;
  readonly description: string;
  readonly documentTypeId: number;
  readonly documentNumber: string;
  readonly active: boolean;
}

/**
 * Raiz del agregado Cliente.
 *
 * Mismas reglas que Product y Brand: sin constructor publico, sin setters, y los
 * cambios pasan por metodos con nombre de intencion. No importa nada de NestJS
 * ni de TypeORM.
 *
 * El cliente no se borra: sus ventas lo referencian y el historico depende de
 * ellas, asi que la unica baja posible es logica.
 */
export class Client {
  private constructor(
    private readonly _id: ClientId,
    private _description: ClientDescription,
    private _document: ClientDocument,
    private _active: boolean,
  ) {}

  static create(params: {
    id: ClientId;
    description: ClientDescription;
    document: ClientDocument;
    active?: boolean;
  }): Client {
    return new Client(
      params.id,
      params.description,
      params.document,
      params.active ?? true,
    );
  }

  static rehydrate(params: {
    id: ClientId;
    description: ClientDescription;
    document: ClientDocument;
    active: boolean;
  }): Client {
    return new Client(
      params.id,
      params.description,
      params.document,
      params.active,
    );
  }

  get id(): ClientId {
    return this._id;
  }

  get description(): ClientDescription {
    return this._description;
  }

  get document(): ClientDocument {
    return this._document;
  }

  get isActive(): boolean {
    return this._active;
  }

  rename(description: ClientDescription): void {
    this._description = description;
  }

  /**
   * Corrige el documento. Tipo y numero se cambian juntos, nunca por separado:
   * cambiar solo el tipo dejaria un DNI de 11 digitos, y el value object existe
   * justamente para que ese estado no sea representable.
   */
  changeDocument(document: ClientDocument): void {
    this._document = document;
  }

  activate(): void {
    this._active = true;
  }

  deactivate(): void {
    this._active = false;
  }

  toSnapshot(): ClientSnapshot {
    return {
      id: this._id.value,
      description: this._description.value,
      documentTypeId: this._document.typeId.value,
      documentNumber: this._document.number,
      active: this._active,
    };
  }
}
