import { InvalidInputError } from '../../../shared/domain/domain.error';

export class InvalidProductTextError extends InvalidInputError {
  readonly code = 'INVALID_PRODUCT_TEXT';

  constructor(message: string) {
    super(message);
  }
}

/**
 * Los limites replican los de db/db.sql. Validarlos aca y no solo en la base
 * significa que el usuario recibe un 400 explicando cual campo se paso, en vez
 * de un 500 con un error del driver de PostgreSQL.
 */

/** product_name varchar(100) NOT NULL */
export class ProductName {
  static readonly MAX = 100;

  private constructor(readonly value: string) {}

  static of(valor: string): ProductName {
    const limpio = valor?.trim() ?? '';
    if (limpio.length === 0) {
      throw new InvalidProductTextError(
        'El nombre del producto no puede estar vacio.',
      );
    }
    if (limpio.length > ProductName.MAX) {
      throw new InvalidProductTextError(
        `El nombre del producto no puede superar ${ProductName.MAX} caracteres, tiene ${limpio.length}.`,
      );
    }
    return new ProductName(limpio);
  }

  toString(): string {
    return this.value;
  }
}

/** product_description varchar(250), acepta ausencia. */
export class ProductDescription {
  static readonly MAX = 250;

  private constructor(readonly value: string | null) {}

  static of(valor: string | null | undefined): ProductDescription {
    if (valor === null || valor === undefined) {
      return new ProductDescription(null);
    }
    const limpio = valor.trim();
    if (limpio.length > ProductDescription.MAX) {
      throw new InvalidProductTextError(
        `La descripcion no puede superar ${ProductDescription.MAX} caracteres, tiene ${limpio.length}.`,
      );
    }
    // Una descripcion vacia es ausencia de descripcion, no una cadena vacia:
    // evita tener dos representaciones distintas de lo mismo en la base.
    return new ProductDescription(limpio.length === 0 ? null : limpio);
  }

  get isPresent(): boolean {
    return this.value !== null;
  }
}

/** product_image varchar(500), URL de la imagen. */
export class ProductImage {
  static readonly MAX = 500;

  private constructor(readonly value: string | null) {}

  static of(valor: string | null | undefined): ProductImage {
    if (valor === null || valor === undefined) {
      return new ProductImage(null);
    }
    const limpio = valor.trim();
    if (limpio.length === 0) {
      return new ProductImage(null);
    }
    if (limpio.length > ProductImage.MAX) {
      throw new InvalidProductTextError(
        `La URL de la imagen no puede superar ${ProductImage.MAX} caracteres, tiene ${limpio.length}.`,
      );
    }
    if (!ProductImage.esRutaValida(limpio)) {
      throw new InvalidProductTextError(
        `La imagen debe ser una URL http/https o una ruta absoluta que empiece con "/", se recibio "${limpio}".`,
      );
    }
    return new ProductImage(limpio);
  }

  private static esRutaValida(valor: string): boolean {
    if (valor.startsWith('/')) return true;
    try {
      const url = new URL(valor);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  get isPresent(): boolean {
    return this.value !== null;
  }
}
