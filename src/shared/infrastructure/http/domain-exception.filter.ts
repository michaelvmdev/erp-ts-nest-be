import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import {
  ConflictError,
  DomainError,
  InvalidInputError,
  NotFoundError,
  UnauthorizedError,
} from '../../domain/domain.error';
import { ApiErrorDto } from './api-error.dto';

/**
 * Traduce cualquier excepcion a la forma unica de ApiErrorDto.
 *
 * Este es el punto donde el dominio se encuentra con HTTP, y el unico. El
 * dominio lanza errores en su propio lenguaje (ProductNotFoundError) y aqui se
 * decide el codigo de estado. Si manana la aplicacion se expone por gRPC, se
 * escribe otro filtro y el dominio no cambia.
 */
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, code, message, incidentId } = this.traducir(
      exception,
      request,
    );

    const body: ApiErrorDto = {
      statusCode: status,
      code,
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      ...(incidentId ? { incidentId } : {}),
    };

    response.status(status).json(body);
  }

  private traducir(
    exception: unknown,
    request: Request,
  ): {
    status: number;
    code: string;
    message: string | string[];
    incidentId?: string;
  } {
    if (exception instanceof DomainError) {
      return {
        status: this.estadoPara(exception),
        code: exception.code,
        message: exception.message,
      };
    }

    // Excepciones de Nest: sobre todo el 400 del ValidationPipe, que trae la
    // lista de campos que fallaron y conviene preservar tal cual.
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const message =
        typeof payload === 'object' && payload !== null && 'message' in payload
          ? ((payload as { message: string | string[] }).message ??
            exception.message)
          : exception.message;

      return { status, code: this.codigoPara(status), message };
    }

    // Todo lo demas es un fallo no previsto. Al cliente le llega un mensaje
    // generico y un identificador; el detalle real queda en el log del servidor.
    const incidentId = `err_${randomUUID().slice(0, 8)}`;
    this.logger.error(
      `[${incidentId}] ${request.method} ${request.url} fallo de forma inesperada`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor.',
      incidentId,
    };
  }

  private estadoPara(error: DomainError): number {
    if (error instanceof NotFoundError) return HttpStatus.NOT_FOUND;
    if (error instanceof ConflictError) return HttpStatus.CONFLICT;
    if (error instanceof UnauthorizedError) return HttpStatus.UNAUTHORIZED;
    if (error instanceof InvalidInputError) return HttpStatus.BAD_REQUEST;
    return HttpStatus.UNPROCESSABLE_ENTITY;
  }

  private codigoPara(status: number): string {
    const mapa: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.PAYLOAD_TOO_LARGE]: 'PAYLOAD_TOO_LARGE',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
      [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
    };
    return mapa[status] ?? 'HTTP_ERROR';
  }
}
