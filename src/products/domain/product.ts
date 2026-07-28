import { Money } from './value-objects/money.value-object';
import { BrandId, ProductId } from './value-objects/identifiers.value-object';
import {
  ProductDescription,
  ProductImage,
  ProductName,
} from './value-objects/product-text.value-object';

/** Estado plano del agregado. Lo usan los mapeadores; el dominio nunca lo expone mutable. */
export interface ProductSnapshot {
  readonly id: string;
  readonly brandId: string;
  readonly name: string;
  readonly description: string | null;
  readonly image: string | null;
  readonly unitPrice: Money;
  readonly active: boolean;
}

/**
 * Raiz del agregado Producto.
 *
 * Reglas que impone:
 *  - Se construye solo por `create` (alta nueva) o `rehydrate` (viene de la base).
 *    No hay constructor publico, asi que es imposible tener un producto a medio armar.
 *  - Los campos son privados y solo se tocan por metodos con nombre de intencion
 *    (`rename`, `reprice`, `deactivate`). No hay setters: cada cambio pasa por una
 *    puerta que puede validar.
 *  - Los tipos son value objects, no strings sueltos. Un precio invalido no llega
 *    a existir: falla al construir el Money.
 *
 * No importa nada de NestJS ni de TypeORM. Se puede instanciar y testear sin
 * levantar la aplicacion ni tocar una base de datos.
 */
export class Product {
  private constructor(
    private readonly _id: ProductId,
    private _brandId: BrandId,
    private _name: ProductName,
    private _description: ProductDescription,
    private _image: ProductImage,
    private _unitPrice: Money,
    private _active: boolean,
  ) {}

  /** Alta de un producto nuevo. Nace activo salvo que se indique lo contrario. */
  static create(params: {
    id: ProductId;
    brandId: BrandId;
    name: ProductName;
    description: ProductDescription;
    image: ProductImage;
    unitPrice: Money;
    active?: boolean;
  }): Product {
    return new Product(
      params.id,
      params.brandId,
      params.name,
      params.description,
      params.image,
      params.unitPrice,
      params.active ?? true,
    );
  }

  /**
   * Reconstruye un producto ya existente desde la persistencia.
   *
   * Separado de `create` a proposito: `create` representa un hecho de negocio
   * ("se dio de alta un producto") y en el futuro podria emitir un evento de
   * dominio; `rehydrate` es puro detalle tecnico y no debe emitir nada.
   */
  static rehydrate(params: {
    id: ProductId;
    brandId: BrandId;
    name: ProductName;
    description: ProductDescription;
    image: ProductImage;
    unitPrice: Money;
    active: boolean;
  }): Product {
    return new Product(
      params.id,
      params.brandId,
      params.name,
      params.description,
      params.image,
      params.unitPrice,
      params.active,
    );
  }

  get id(): ProductId {
    return this._id;
  }

  get brandId(): BrandId {
    return this._brandId;
  }

  get name(): ProductName {
    return this._name;
  }

  get description(): ProductDescription {
    return this._description;
  }

  get image(): ProductImage {
    return this._image;
  }

  get unitPrice(): Money {
    return this._unitPrice;
  }

  get isActive(): boolean {
    return this._active;
  }

  rename(name: ProductName): void {
    this._name = name;
  }

  describeAs(description: ProductDescription): void {
    this._description = description;
  }

  changeImage(image: ProductImage): void {
    this._image = image;
  }

  reprice(unitPrice: Money): void {
    this._unitPrice = unitPrice;
  }

  reassignBrand(brandId: BrandId): void {
    this._brandId = brandId;
  }

  activate(): void {
    this._active = true;
  }

  deactivate(): void {
    this._active = false;
  }

  toSnapshot(): ProductSnapshot {
    return {
      id: this._id.value,
      brandId: this._brandId.value,
      name: this._name.value,
      description: this._description.value,
      image: this._image.value,
      unitPrice: this._unitPrice,
      active: this._active,
    };
  }
}
