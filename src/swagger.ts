import { INestApplication, Logger } from '@nestjs/common';
import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerModule,
  getSchemaPath,
} from '@nestjs/swagger';

import type { Request, Response } from 'express';
import { ApiErrorDto } from './shared/infrastructure/http/api-error.dto';
import { ejemploDeError } from './shared/infrastructure/http/error-examples';

/** Ruta donde se monta la UI de Swagger. El JSON queda en `${SWAGGER_PATH}-json`. */
export const SWAGGER_PATH = 'docs';

/** Ruta donde se monta la UI de Scalar. */
export const SCALAR_PATH = 'reference';

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
  // La respuesta se construye dentro del bucle, una por operacion. Compartir un
  // unico objeto entre todas parece inofensivo, pero al ponerle luego su ejemplo
  // se estaria escribiendo sobre la misma referencia y el ultimo metodo
  // procesado dejaria su `method` en el ejemplo de todos los demas.
  const nuevaRespuesta = () => ({
    description:
      'Error interno no previsto. El cuerpo incluye un `incidentId` que permite ' +
      'cruzar la respuesta con la traza completa del servidor; el detalle del fallo ' +
      'no se expone al cliente.',
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(ApiErrorDto) },
      },
    },
  });

  for (const item of Object.values(document.paths)) {
    for (const metodo of METODOS_HTTP) {
      const operacion = item[metodo];
      if (!operacion) {
        continue;
      }
      if (operacion.responses?.['500']) {
        continue;
      }
      operacion.responses = { ...operacion.responses, '500': nuevaRespuesta() };
    }
  }

  return document;
}

/**
 * Declara la respuesta 429 en toda operacion que no la traiga ya.
 *
 * El rate-limiting es global —un guard sobre todos los endpoints—, asi que el
 * 429 forma parte del contrato de todos por igual, con el mismo criterio que el
 * 500: se inyecta aqui y no con un decorador por controlador que se olvidaria en
 * el endpoint nuevo. Las operaciones exentas con `@SkipThrottle` igual lo
 * declaran; documentarlo de mas es inocuo y evita razonar sobre que rutas quedan
 * fuera.
 */
function documentarLimiteDePeticiones(document: OpenAPIObject): OpenAPIObject {
  const nuevaRespuesta = () => ({
    description:
      'Se supero el limite de peticiones permitido en la ventana de tiempo. El cliente ' +
      'debe espaciar sus llamadas antes de reintentar.',
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(ApiErrorDto) },
      },
    },
  });

  for (const item of Object.values(document.paths)) {
    for (const metodo of METODOS_HTTP) {
      const operacion = item[metodo];
      if (!operacion) {
        continue;
      }
      if (operacion.responses?.['429']) {
        continue;
      }
      operacion.responses = { ...operacion.responses, '429': nuevaRespuesta() };
    }
  }

  return document;
}

/**
 * Pone un ejemplo propio en cada respuesta de error.
 *
 * Todas comparten el esquema ApiErrorDto, asi que Swagger muestra por defecto el
 * mismo ejemplo en el 400, el 409 y el 500: el que traen los `example` del DTO.
 * Aqui se reemplaza por uno construido con la ruta, el metodo y el codigo reales
 * de cada operacion, de modo que lo que se lee en la documentacion coincide con
 * lo que devuelve el servidor.
 *
 * Solo se tocan las respuestas 400 y superiores que usan ApiErrorDto: los 2xx
 * tienen su propio esquema y sus propios ejemplos.
 */
function ejemplificarErrores(document: OpenAPIObject): OpenAPIObject {
  const refError = getSchemaPath(ApiErrorDto);

  for (const [ruta, item] of Object.entries(document.paths)) {
    for (const metodo of METODOS_HTTP) {
      const operacion = item[metodo];
      if (!operacion?.responses) {
        continue;
      }

      for (const [codigo, respuesta] of Object.entries(operacion.responses)) {
        const status = Number(codigo);
        if (!respuesta || !Number.isInteger(status) || status < 400) {
          continue;
        }

        const media =
          'content' in respuesta
            ? respuesta.content?.['application/json']
            : undefined;
        const schema = media?.schema;

        // El esquema puede ser una referencia o una definicion inline. Solo se
        // ejemplifican las que apuntan a ApiErrorDto.
        const ref = schema && '$ref' in schema ? schema.$ref : undefined;
        if (!media || ref !== refError) {
          continue;
        }

        media.example = ejemploDeError(status, ruta, metodo);
      }
    }
  }

  return document;
}

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('AppSales API')
    .setDescription(
      'API de AppSales, el sistema de ventas y compras de Michael Dev S.A.C.: ' +
        'productos, marcas, categorias, proveedores, clientes, ubigeo, ' +
        'comprobantes y compras. Esta documentacion solo se publica fuera de ' +
        'produccion.',
    )
    // npm expone la version del package.json al correr por script; el valor de
    // respaldo cubre el caso de ejecutar `node dist/main.js` a mano.
    .setVersion(process.env.npm_package_version ?? '0.0.1')
    .addBearerAuth()
    .build();

  // Factory en vez de documento ya construido: Nest 11 lo genera al primer
  // request en lugar de en el arranque, y asi no penaliza el tiempo de inicio.
  // El orden importa: primero se agregan el 500 y el 429 a todas las operaciones
  // y despues se ejemplifican los errores, para que las respuestas recien
  // inyectadas tambien reciban su ejemplo.
  const documentFactory = () =>
    ejemplificarErrores(
      documentarLimiteDePeticiones(
        documentarErrorInterno(
          // extraModels garantiza que ApiErrorDto quede en components aunque
          // ningun endpoint lo referencie explicitamente: las respuestas 429 y
          // 500 que se inyectan apuntan a el por $ref.
          SwaggerModule.createDocument(app, config, {
            extraModels: [ApiErrorDto],
          }),
        ),
      ),
    );

  SwaggerModule.setup(SWAGGER_PATH, app, documentFactory, {
    customSiteTitle: 'AppSales API — docs',
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

/**
 * Pagina HTML que embebe la UI de Scalar mediante su bundle standalone.
 *
 * Se sirve esta pagina en vez de usar `@scalar/nestjs-api-reference`: ese paquete
 * solo se distribuye como ESM (su build CJS hace `require` de una dependencia
 * ESM-only y revienta al arrancar bajo CommonJS, que es como corre este proyecto).
 * El embed por CDN es la integracion oficial y no arrastra ese problema.
 *
 * El `data-url` apunta al mismo JSON que publica SwaggerModule, asi que Scalar
 * hereda todos los endpoints y los enriquecidos (respuestas 429/500 y ejemplos).
 */
function paginaScalar(): string {
  return `<!doctype html>
<html>
  <head>
    <title>AppSales API — reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>body { margin: 0; }</style>
  </head>
  <body>
    <script id="api-reference" data-url="/${SWAGGER_PATH}-json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;
}

/**
 * Monta la UI de Scalar como alternativa a Swagger UI.
 *
 * No genera un segundo documento: reutiliza el `${SWAGGER_PATH}-json` que ya
 * publica SwaggerModule, por lo que debe llamarse despues de setupSwagger.
 *
 * Queda bajo la misma condicion que Swagger (`isSwaggerEnabled`): en produccion
 * no se publica ninguna de las dos.
 */
export function setupScalar(app: INestApplication): void {
  const html = paginaScalar();
  app.use(`/${SCALAR_PATH}`, (_req: Request, res: Response) => {
    res.type('html').send(html);
  });

  Logger.log(`Documentacion (Scalar) disponible en /${SCALAR_PATH}`, 'Scalar');
}
