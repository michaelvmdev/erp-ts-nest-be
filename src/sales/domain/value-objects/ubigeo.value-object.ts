import { InvalidInputError } from '../../../shared/domain/domain.error';

export class InvalidUbigeoError extends InvalidInputError {
  readonly code = 'INVALID_UBIGEO';

  constructor(message: string) {
    super(message);
  }
}

/**
 * Ubicacion geografica de una venta.
 *
 * Se construye con el codigo del distrito y deriva provincia y departamento de
 * sus prefijos: los 4 primeros digitos son la provincia y los 2 primeros el
 * departamento. Esa jerarquia la garantizan los CHECK de prefijo del esquema.
 *
 * Derivarlos en vez de recibirlos elimina toda una clase de error. La tabla de
 * ventas tiene claves foraneas compuestas sobre (provincia, departamento) y
 * (distrito, provincia), asi que un cliente que enviara los tres por separado
 * podria mandar un distrito del Cusco con el departamento de Lima; la base lo
 * rechazaria, pero con un error de restriccion en vez de uno explicativo. Aqui
 * la combinacion invalida no puede llegar a existir.
 */
export class Ubigeo {
  private constructor(
    readonly districtId: string,
    readonly provinceId: string,
    readonly departmentId: string,
  ) {}

  static ofDistrict(districtId: string): Ubigeo {
    const limpio = districtId?.trim() ?? '';
    if (!/^[0-9]{6}$/.test(limpio)) {
      throw new InvalidUbigeoError(
        `El codigo de distrito debe tener 6 digitos, se recibio "${districtId}".`,
      );
    }
    return new Ubigeo(limpio, limpio.slice(0, 4), limpio.slice(0, 2));
  }

  /**
   * Reconstruye desde la base comprobando la coherencia de los tres codigos.
   * Si alguna vez dejaran de encajar, es mejor enterarse al leer que propagar
   * una fila incoherente hacia arriba.
   */
  static rehydrate(
    districtId: string,
    provinceId: string,
    departmentId: string,
  ): Ubigeo {
    const u = Ubigeo.ofDistrict(districtId);
    if (
      u.provinceId !== provinceId.trim() ||
      u.departmentId !== departmentId.trim()
    ) {
      throw new InvalidUbigeoError(
        `El distrito ${districtId} no pertenece a la provincia ${provinceId} ` +
          `ni al departamento ${departmentId}.`,
      );
    }
    return u;
  }

  equals(otro: Ubigeo): boolean {
    return this.districtId === otro.districtId;
  }
}
