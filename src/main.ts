import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './shared/infrastructure/http/domain-exception.filter';
import { isSwaggerEnabled, setupScalar, setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Servidor escuchando en http://localhost:${port}`, 'Bootstrap');
}
void bootstrap();
