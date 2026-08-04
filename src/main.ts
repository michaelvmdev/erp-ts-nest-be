import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Request, type Response } from 'express';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './shared/infrastructure/http/domain-exception.filter';
import { isSwaggerEnabled, setupScalar, setupSwagger } from './swagger';

async function configureApp(app: Awaited<ReturnType<typeof NestFactory.create>>) {
  app.useGlobalPipes(
    new ValidationPipe({
      // Descarta las propiedades que no estan declaradas en el DTO.
      whitelist: true,
      // Y ademas rechaza la peticion si venian: es preferible avisarle al cliente
      // que mando un campo que no existe a ignorarlo en silencio y que crea que
      // surtio efecto.
      forbidNonWhitelisted: true,
      // Convierte los tipos primitivos segun la firma del DTO y aplica @Type().
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      // Oculta las restricciones internas de class-validator en la respuesta;
      // los mensajes propios de cada DTO ya explican que fallo.
      validationError: { target: false, value: false },
    }),
  );

  // Un unico filtro traduce todo error a la forma de ApiErrorDto.
  app.useGlobalFilters(new DomainExceptionFilter());

  if (isSwaggerEnabled()) {
    setupSwagger(app);
    // Scalar reutiliza el JSON que publica Swagger, asi que va despues.
    setupScalar(app);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await configureApp(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Servidor escuchando en http://localhost:${port}`, 'Bootstrap');
}

let cachedServer: ReturnType<typeof express> | undefined;

async function createServer() {
  if (cachedServer) return cachedServer;

  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  await configureApp(app);
  await app.init();
  cachedServer = server;
  return server;
}

export default async function handler(req: Request, res: Response) {
  const server = await createServer();
  return server(req, res);
}

if (require.main === module) {
  void bootstrap();
}
