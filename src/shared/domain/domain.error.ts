/**
 * Raiz de todos los errores del dominio.
 *
 * El dominio no conoce HTTP: no lanza NotFoundException ni BadRequestException.
 * Lanza errores que describen *que* salio mal en terminos del negocio, y es el
 * adaptador de entrada (el filtro HTTP) el que decide con que codigo responder.
 * Asi el mismo dominio sirve para una API REST, una cola de mensajes o un CLI.
 */
export abstract class DomainError extends Error {
  /**
   * Identificador estable y legible por maquina. A diferencia del mensaje, que
   * es para humanos y puede reescribirse, este codigo es parte del contrato:
   * un cliente puede ramificar sobre el sin parsear texto.
   */
  abstract readonly code: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Error.captureStackTrace?.(this, new.target);
  }
}

/** La entidad solicitada no existe. */
export abstract class NotFoundError extends DomainError {}

/** Los datos recibidos violan una invariante del dominio. */
export abstract class InvalidInputError extends DomainError {}

/** La operacion choca con el estado actual del sistema. */
export abstract class ConflictError extends DomainError {}

/** Identidad no verificada (credenciales incorrectas o sesión caducada). */
export abstract class UnauthorizedError extends DomainError {}
