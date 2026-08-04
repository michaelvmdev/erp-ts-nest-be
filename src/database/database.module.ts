import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

interface DatabaseUrlOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

function getDatabaseUrlOptions(url: string): DatabaseUrlOptions {
  const parsed = new URL(url);

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 5432),
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
  };
}

function buildLocalDatabaseUrl(config: ConfigService): string {
  const host = config.getOrThrow<string>('POSTGRES_HOST');
  const port = config.getOrThrow<number>('POSTGRES_PORT');
  const username = encodeURIComponent(
    config.getOrThrow<string>('POSTGRES_USER'),
  );
  const password = encodeURIComponent(
    config.getOrThrow<string>('POSTGRES_PASSWORD'),
  );
  const database = config.getOrThrow<string>('POSTGRES_DATABASE');

  return `postgres://${username}:${password}@${host}:${port}/${database}`;
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const logger = new Logger('DatabaseModule');
        const postgresUrl =
          config.get<string>('DB_POSTGRES_URL') ||
          buildLocalDatabaseUrl(config);
        const ssl =
          config.get<boolean>('POSTGRES_SSL') ||
          postgresUrl.includes('sslmode=require')
            ? { rejectUnauthorized: false }
            : undefined;
        const urlOptions = getDatabaseUrlOptions(postgresUrl);
        logger.log(
          `PostgreSQL ${urlOptions.username}@${urlOptions.host}:${urlOptions.port}/${urlOptions.database}`,
        );

        return {
          type: 'postgres',

          // getOrThrow y no get: si una variable falta, el error apunta al nombre
          // exacto en vez de fallar mas tarde dentro del driver. validateEnv ya
          // deberia haberlo cortado antes, esto es la segunda linea de defensa.
          host: urlOptions.host,
          port: urlOptions.port,
          username: urlOptions.username,
          password: urlOptions.password,
          database: urlOptions.database,
          ssl,

          // NUNCA poner esto en true. El esquema de db/db.sql esta escrito a mano
          // e incluye cosas que TypeORM no sabe representar: CHECK de formato,
          // claves foraneas compuestas y tipos char(2)/char(4)/char(6) del ubigeo.
          // Con synchronize activo, TypeORM intentaria "corregir" el esquema para
          // que coincida con las entidades y destruiria esas garantias.
          // Los cambios de esquema van por SQL o por migraciones.
          synchronize: false,

          // Evita que TypeORM corra migraciones sin que se lo pidan explicitamente.
          migrationsRun: false,

          // Cada modulo que use TypeOrmModule.forFeature registra sus entidades
          // solo; no hay que mantener una lista central.
          autoLoadEntities: true,

          logging: config.get<boolean>('POSTGRES_LOGGING')
            ? 'all'
            : ['error', 'warn'],

          // Si la base todavia no esta lista al arrancar, reintenta en vez de
          // tumbar el proceso al primer intento fallido.
          retryAttempts: 5,
          retryDelay: 3000,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
