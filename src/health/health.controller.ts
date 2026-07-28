import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly dataSource: DataSource) {}

  @Get('db')
  @ApiOperation({ summary: 'Comprobar la conexion con PostgreSQL' })
  async checkDatabase(): Promise<{
    status: string;
    database: string;
    version: string;
    latencyMs: number;
  }> {
    const inicio = Date.now();
    try {
      const [row] = await this.dataSource.query<
        { database: string; version: string }[]
      >(
        "SELECT current_database() AS database, current_setting('server_version') AS version",
      );

      return {
        status: 'ok',
        database: row.database,
        version: row.version,
        latencyMs: Date.now() - inicio,
      };
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.error(`No se pudo consultar la base: ${mensaje}`);
      // 503 y no 500: el servicio esta vivo, la dependencia no.
      throw new ServiceUnavailableException(
        `Base de datos inaccesible: ${mensaje}`,
      );
    }
  }
}
