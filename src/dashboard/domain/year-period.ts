/**
 * Un ano calendario, como rango semiabierto de fechas.
 *
 * Hermano de MonthPeriod, pero para los diagramas anuales del tablero: el front
 * pide un ano y recibe una serie de doce meses. El caso de uso construye este
 * objeto a partir del ano validado y lo pasa al repositorio, de modo que el
 * filtro de la consulta y la etiqueta salen de la misma fuente.
 *
 * Los limites son cadenas `YYYY-MM-DD` y no `Date`: la columna `sale_date` es un
 * `date` sin zona horaria, y compararla contra un `Date` haria que el driver le
 * aplicara la zona del servidor. Como rango semiabierto —`>= inicio` y
 * `< finExclusivo`— aprovecha el indice de `sale_date`.
 */
export class YearPeriod {
  private constructor(
    /** El ano, como numero. */
    readonly year: number,
    /** Primer dia del ano, inclusive: `YYYY-01-01`. */
    readonly start: string,
    /** Primer dia del ano siguiente, exclusive: `(YYYY+1)-01-01`. */
    readonly endExclusive: string,
  ) {}

  static of(year: number): YearPeriod {
    return new YearPeriod(year, `${year}-01-01`, `${year + 1}-01-01`);
  }
}
