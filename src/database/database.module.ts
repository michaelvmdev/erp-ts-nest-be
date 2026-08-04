import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const postgresUrl = config.get<string>('POSTGRES_URL');
        const ssl =
          config.get<boolean>('POSTGRES_SSL') ||
          postgresUrl?.includes('sslmode=require')
            ? { rejectUnauthorized: false }
            : undefined;

        return {
          type: 'postgres',

          // getOrThrow y no get: si una variable falta, el error apunta al nombre
          // exacto en vez de fallar mas tarde dentro del driver. validateEnv ya
          // deberia haberlo cortado antes, esto es la segunda linea de defensa.
          url: postgresUrl === '' ? undefined : postgresUrl,
          host:
            postgresUrl === ''
              ? config.getOrThrow<string>('POSTGRES_HOST')
              : undefined,
          port:
            postgresUrl === ''
              ? config.getOrThrow<number>('POSTGRES_PORT')
              : undefined,
          username:
            postgresUrl === ''
              ? config.getOrThrow<string>('POSTGRES_USER')
              : undefined,
          password:
            postgresUrl === ''
              ? config.getOrThrow<string>('POSTGRES_PASSWORD')
              : undefined,
          database:
            postgresUrl === ''
              ? config.getOrThrow<string>('POSTGRES_DATABASE')
              : undefined,
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
