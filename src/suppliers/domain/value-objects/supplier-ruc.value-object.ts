import { InvalidInputError } from '../../../shared/domain/domain.error';

export class InvalidSupplierRucError extends InvalidInputError {
  readonly code = 'INVALID_SUPPLIER_RUC';

  constructor(message: string) {
    super(message);
  }
}

/** Pesos del algoritmo de digito verificador de SUNAT, modulo 11. */
const PESOS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/**
 * Calcula el digito verificador de un RUC a partir de sus primeros 10 digitos.
 *
 * Mismo algoritmo que usa SUNAT: verificado contra su propio RUC publico
 * (20100070970, digito verificador 0), asi que valida un RUC real y no solo
 * su forma.
 */
function digitoVerificador(primerosDiez: string): string {
  const digitos = primerosDiez.split('').map(Number);
  const suma = digitos.reduce((acc, d, i) => acc + d * PESOS[i], 0);
  const resto = suma % 11;
  let dv = 11 - resto;
  if (dv === 10) dv = 0;
  if (dv === 11) dv = 1;
  return String(dv);
}

/**
 * RUC de un proveedor. `suppliers` solo admite empresas: un RUC de persona
 * juridica en Peru siempre empieza en "20", a diferencia del de una persona
 * natural (que empieza en "10").
 *
 * Se valida el digito verificador y no solo el formato, con el mismo criterio
 * que el documento de clients: sirve para probar una validacion real.
 */
export class SupplierRuc {
  private constructor(readonly value: string) {}

  static of(valor: string): SupplierRuc {
    const limpio = (valor ?? '').trim();

    if (!/^20[0-9]{9}$/.test(limpio)) {
      throw new InvalidSupplierRucError(
        `El RUC debe tener 11 digitos y empezar en "20" (persona juridica), se recibio "${valor}".`,
      );
    }

    const esperado = digitoVerificador(limpio.slice(0, 10));
    if (esperado !== limpio.slice(10)) {
      throw new InvalidSupplierRucError(
        `El RUC "${limpio}" no es valido: el digito verificador no corresponde (deberia ser ${esperado}).`,
      );
    }

    return new SupplierRuc(limpio);
  }

  equals(otro: SupplierRuc): boolean {
    return this.value === otro.value;
  }

  toString(): string {
    return this.value;
  }
}
