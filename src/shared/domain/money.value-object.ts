import { InvalidInputError } from './domain.error';

export class InvalidMoneyError extends InvalidInputError {
  readonly code = 'INVALID_MONEY';

  constructor(message: string) {
    super(message);
  }
}

/**
 * Importe monetario.
 *
 * Guarda centimos como entero, no un `number` decimal. Con punto flotante,
 * 0.1 + 0.2 da 0.30000000000000004 y un total de venta termina descuadrado por
 * centimos que nadie sabe explicar. Trabajando en centimos toda operacion es
 * aritmetica entera y exacta.
 *
 * El limite superior corresponde a numeric(12,2) del esquema.
 */
export class Money {
  /** 9 999 999 999.99 expresado en centimos. */
  private static readonly MAX_CENTIMOS = 999_999_999_999;

  private constructor(readonly centimos: number) {}

  /** Desde el string decimal que devuelve PostgreSQL para numeric(12,2). */
  static fromDecimalString(valor: string): Money {
    const limpio = valor?.trim() ?? '';
    if (!/^-?\d+(\.\d{1,2})?$/.test(limpio)) {
      throw new InvalidMoneyError(
        `El importe debe tener a lo sumo dos decimales, se recibio "${valor}".`,
      );
    }
    const [entera, decimal = ''] = limpio.split('.');
    const signo = entera.startsWith('-') ? -1 : 1;
    const enteraAbs = entera.replace('-', '');
    const centimos =
      signo * (Number(enteraAbs) * 100 + Number(decimal.padEnd(2, '0')));
    return Money.fromCentimos(centimos);
  }

  /** Desde un numero decimal, tal como llega en un JSON. */
  static fromNumber(valor: number): Money {
    if (!Number.isFinite(valor)) {
      throw new InvalidMoneyError(
        `El importe debe ser un numero finito, se recibio ${valor}.`,
      );
    }
    const centimos = Math.round(valor * 100);
    // Si redondear cambio el valor, venian mas de dos decimales.
    if (Math.abs(centimos / 100 - valor) > Number.EPSILON * Math.abs(valor)) {
      throw new InvalidMoneyError(
        `El importe no puede tener mas de dos decimales, se recibio ${valor}.`,
      );
    }
    return Money.fromCentimos(centimos);
  }

  static fromCentimos(centimos: number): Money {
    if (!Number.isInteger(centimos)) {
      throw new InvalidMoneyError(
        `Los centimos deben ser un entero, se recibio ${centimos}.`,
      );
    }
    if (centimos < 0) {
      throw new InvalidMoneyError('El importe no puede ser negativo.');
    }
    if (centimos > Money.MAX_CENTIMOS) {
      throw new InvalidMoneyError(
        `El importe supera el maximo admitido (${Money.MAX_CENTIMOS / 100}).`,
      );
    }
    return new Money(centimos);
  }

  /** Representacion para persistir en numeric(12,2). */
  toDecimalString(): string {
    const unidades = Math.floor(this.centimos / 100);
    const resto = this.centimos % 100;
    return `${unidades}.${String(resto).padStart(2, '0')}`;
  }

  /** Representacion para serializar en JSON. */
  toNumber(): number {
    return this.centimos / 100;
  }

  equals(otro: Money): boolean {
    return this.centimos === otro.centimos;
  }
}
