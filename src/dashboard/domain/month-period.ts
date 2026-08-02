/**
 * Un mes calendario, como rango semiabierto de fechas.
 *
 * El caso de uso decide "el mes actual" desde el reloj del servidor y pasa este
 * objeto al repositorio, de modo que la etiqueta (`label`) y el filtro de la
 * consulta salen de la misma fuente: no puede darse que la cifra sea de un mes y
 * el rotulo de otro por un cruce de medianoche.
 *
 * Los limites son cadenas `YYYY-MM-DD` y no `Date`: la columna `sale_date` es un
 * `date` sin zona horaria, y compararla contra un `Date` haria que el driver le
 * aplicara la zona del servidor. Como rango semiabierto —`>= inicio` y
 * `< finExclusivo`— aprovecha el indice de `sale_date` y no depende de cuantos
 * dias tiene el mes.
 */
export class MonthPeriod {
  private constructor(
    /** Etiqueta legible del mes, `YYYY-MM`. */
    readonly label: string,
    /** Primer dia del mes, inclusive: `YYYY-MM-01`. */
    readonly start: string,
    /** Primer dia del mes siguiente, exclusive. */
    readonly endExclusive: string,
  ) {}

  static current(now: Date = new Date()): MonthPeriod {
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-based
    const inicio = new Date(year, month, 1);
    const fin = new Date(year, month + 1, 1);
    return new MonthPeriod(
      `${year}-${MonthPeriod.dosDigitos(month + 1)}`,
      MonthPeriod.aFecha(inicio),
      MonthPeriod.aFecha(fin),
    );
  }

  private static aFecha(d: Date): string {
    return `${d.getFullYear()}-${MonthPeriod.dosDigitos(
      d.getMonth() + 1,
    )}-${MonthPeriod.dosDigitos(d.getDate())}`;
  }

  private static dosDigitos(n: number): string {
    return String(n).padStart(2, '0');
  }
}
