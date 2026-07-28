import { INestApplication, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Ruta donde se monta la UI. El JSON queda en `${SWAGGER_PATH}-json`. */
export const SWAGGER_PATH = 'docs';

/**
 * Decide si la documentacion debe publicarse.
 *
 * En produccion devuelve false siempre: ninguna variable de entorno puede
 * activarla. Exponer el esquema completo de la API es regalarle a un atacante
 * el mapa de todos los endpoints, sus parametros y sus formas de respuesta.
 *
 * Fuera de produccion queda activa por defecto y se puede apagar con
 * SWAGGER_ENABLED=false.
 */
export function isSwaggerEnabled(): boolean {
  const env = (process.env.NODE_ENV ?? 'development').toLowerCase();
  if (env === 'production') {
    return false;
  }
  return process.env.SWAGGER_ENABLED?.toLowerCase() !== 'false';
}

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('dbSales API')
    .setDescription(
      'API de ventas: productos, marcas, clientes, ubigeo y comprobantes. ' +
        'Esta documentacion solo se publica fuera de produccion.',
    )
    // npm expone la version del package.json al correr por script; el valor de
    // respaldo cubre el caso de ejecutar `node dist/main.js` a mano.
    .setVersion(process.env.npm_package_version ?? '0.0.1')
    .addBearerAuth()
    .build();

  // Factory en vez de documento ya construido: Nest 11 lo genera al primer
  // request en lugar de en el arranque, y asi no penaliza el tiempo de inicio.
  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_PATH, app, documentFactory, {
    customSiteTitle: 'dbSales API — docs',
    swaggerOptions: {
      // Conserva el token entre recargas de la pagina.
      persistAuthorization: true,
      // Ordena etiquetas y operaciones alfabeticamente en vez de por orden de registro.
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  Logger.log(`Documentacion disponible en /${SWAGGER_PATH}`, 'Swagger');
}
