import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { isSwaggerEnabled, setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (isSwaggerEnabled()) {
    setupSwagger(app);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Servidor escuchando en http://localhost:${port}`, 'Bootstrap');
}
void bootstrap();
