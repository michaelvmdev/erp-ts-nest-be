import { INestApplication, Logger } from '@nestjs/common';
import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerModule,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiErrorDto } from './shared/infrastructure/http/api-error.dto';

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

const METODOS_HTTP = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
] as const;

/**
 * Declara la respuesta 500 en toda operacion que no la traiga ya.
 *
 * Cualquier endpoint puede fallar de forma imprevista, asi que el 500 forma
 * parte del contrato de todos por igual. Se inyecta aqui y no con un decorador
 * en cada controlador por dos razones: son once operaciones hoy y crecen, y un
 * decorador repetido se olvida justo en el endpoint nuevo. Este recorrido no
 * puede olvidarse de ninguno.
 *
 * Si una operacion ya declara su propio 500, se respeta.
 */
function documentarErrorInterno(document: OpenAPIObject): OpenAPIObject {
  const respuesta = {
    description:
      'Error interno no previsto. El cuerpo incluye un `incidentId` que permite ' +
      'cruzar la respuesta con la traza completa del servidor; el detalle del fallo ' +
      'no se expone al cliente.',
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(ApiErrorDto) },
      },
    },
  };

  for (const item of Object.values(document.paths)) {
    for (const metodo of METODOS_HTTP) {
      const operacion = item[metodo];
      if (!operacion) {
        continue;
      }
      if (operacion.responses?.['500']) {
        continue;
      }
      operacion.responses = { ...operacion.responses, '500': respuesta };
    }
  }

  return document;
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
  const documentFactory = () =>
    documentarErrorInterno(
      // extraModels garantiza que ApiErrorDto quede en components aunque ningun
      // endpoint lo referencie explicitamente: la respuesta 500 que se inyecta
      // mas abajo apunta a el por $ref.
      SwaggerModule.createDocument(app, config, { extraModels: [ApiErrorDto] }),
    );

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
