import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { ApiErrorDto } from '../shared/infrastructure/http/api-error.dto';
import { HealthResponseDto } from './health.response.dto';

// Exento del rate-limiting: las sondas de salud de un balanceador consultan esta
// ruta con frecuencia, y limitarla haria que el propio chequeo dispare el 429.
@SkipThrottle()
@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly dataSource: DataSource) {}

  @Get('db')
  @ApiOperation({
    summary: 'Comprobar el estado del almacen de datos',
    description:
      'Ejecuta una consulta minima contra el almacen y devuelve si respondio y cuanto tardo.\n\n' +
      'La respuesta es deliberadamente escueta: no incluye motor, version, nombre del ' +
      'almacen ni detalle del fallo. Ese es el tipo de dato con el que un atacante ' +
      'acota que vulnerabilidades conocidas aplican. El diagnostico completo queda en el ' +
      'log del servidor.',
  })
  @ApiOkResponse({
    description: 'El almacen respondio.',
    type: HealthResponseDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'El almacen no respondio.',
    type: ApiErrorDto,
  })
  async checkDatabase(): Promise<HealthResponseDto> {
    const inicio = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', latencyMs: Date.now() - inicio };
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      // El detalle va al log, no a la respuesta: el mensaje del driver revela
      // host, puerto, usuario y nombre del almacen.
      this.logger.error(`No se pudo consultar el almacen de datos: ${mensaje}`);
      // 503 y no 500: el servicio esta vivo, la dependencia no.
      throw new ServiceUnavailableException('El almacen de datos no responde.');
    }
  }
}
