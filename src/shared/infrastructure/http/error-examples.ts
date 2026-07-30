/**
 * Ejemplos de error para Swagger, uno por codigo de estado y por operacion.
 *
 * Todas las respuestas de error comparten el esquema ApiErrorDto, asi que sin
 * esto Swagger muestra el mismo ejemplo en el 400, el 409 y el 500: el que
 * traen los `example` del DTO. Un ejemplo que dice 404 debajo de un 409 confunde
 * mas de lo que ayuda.
 *
 * Los ejemplos se arman a partir de la ruta y el metodo reales de cada
 * operacion, de modo que el `path`, el `method` y el `code` que muestra la
 * documentacion son los que devolveria el servidor.
 */

const TIMESTAMP = '2026-07-28T02:14:07.123Z';
const INCIDENTE = 'err_1c9a3f2b';

/** Valores de ejemplo para sustituir los parametros de ruta. */
const PARAMETROS: Record<string, string> = {
  productId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  brandId: '9c1e2f40-6b3a-4d21-8f77-1a2b3c4d5e6f',
  clientId: '5b8f3c21-9d4e-4a7b-8c16-2f9e1d3a5b7c',
};

interface CodigoYMensaje {
  code: string;
  message: string | string[];
}

/**
 * Codigos y mensajes reales de cada recurso. El 404 y el 409 no son genericos:
 * cada agregado tiene los suyos, y mostrarlos ayuda a saber sobre que ramificar.
 */
const POR_RECURSO: Record<
  string,
  { notFound?: CodigoYMensaje; conflict?: CodigoYMensaje }
> = {
  products: {
    notFound: {
      code: 'PRODUCT_NOT_FOUND',
      message: `No existe un producto con id ${PARAMETROS.productId}.`,
    },
    conflict: {
      code: 'PRODUCT_IN_USE',
      message:
        `El producto ${PARAMETROS.productId} no se puede eliminar porque aparece en ventas ` +
        'registradas. Desactivalo con PATCH /products/{productId} enviando "productActive": false.',
    },
  },
  brands: {
    notFound: {
      code: 'BRAND_NOT_FOUND',
      message: `No existe una marca con id ${PARAMETROS.brandId}.`,
    },
    conflict: {
      code: 'BRAND_ALREADY_EXISTS',
      message: 'Ya existe una marca con la descripcion "Logitech".',
    },
  },
  clients: {
    notFound: {
      code: 'CLIENT_NOT_FOUND',
      message: `No existe un cliente con id ${PARAMETROS.clientId}.`,
    },
    conflict: {
      code: 'CLIENT_DOCUMENT_ALREADY_EXISTS',
      message: 'Ya existe un cliente registrado con el documento 20100043212.',
    },
  },
  'document-types': {
    notFound: {
      code: 'DOCUMENT_TYPE_NOT_FOUND',
      message: 'No existe un tipo de documento con id 9.',
    },
  },
};

/** Primer segmento de la ruta: identifica el recurso. */
function recursoDe(ruta: string): string {
  return ruta.split('/').filter(Boolean)[0] ?? '';
}

function rutaConParametros(ruta: string): string {
  return ruta.replace(
    /\{(\w+)\}/g,
    (_coincidencia, nombre: string) => PARAMETROS[nombre] ?? '1',
  );
}

function codigoYMensaje(status: number, ruta: string): CodigoYMensaje {
  const recurso = POR_RECURSO[recursoDe(ruta)];

  switch (status) {
    case 400:
      // El 400 llega por dos caminos. Se muestra el del ValidationPipe, que es el
      // mas frecuente y el unico cuyo `message` es una lista: asi queda claro que
      // el campo admite ambas formas. Las validaciones del dominio usan su propio
      // codigo, como INVALID_CLIENT_DOCUMENT.
      return {
        code: 'VALIDATION_ERROR',
        message: [
          'documentNumber debe tener 8 u 11 digitos, sin letras ni separadores.',
          'clientDescription no puede estar vacio.',
        ],
      };

    case 404:
      return (
        recurso?.notFound ?? {
          code: 'NOT_FOUND',
          message: 'El recurso solicitado no existe.',
        }
      );

    case 409:
      return (
        recurso?.conflict ?? {
          code: 'CONFLICT',
          message: 'La operacion choca con el estado actual del recurso.',
        }
      );

    case 422:
      return {
        code: 'UNPROCESSABLE_ENTITY',
        message: 'La peticion es valida pero no se puede procesar.',
      };

    case 503:
      return {
        code: 'SERVICE_UNAVAILABLE',
        message: 'El almacen de datos no responde.',
      };

    default:
      return { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' };
  }
}

/** Cuerpo de ejemplo para un codigo de estado en una operacion concreta. */
export function ejemploDeError(
  status: number,
  ruta: string,
  metodo: string,
): Record<string, unknown> {
  const { code, message } = codigoYMensaje(status, ruta);

  const ejemplo: Record<string, unknown> = {
    statusCode: status,
    code,
    message,
    path: rutaConParametros(ruta),
    method: metodo.toUpperCase(),
    timestamp: TIMESTAMP,
  };

  // incidentId solo existe en el 500: el filtro lo genera unicamente para los
  // fallos no previstos. Incluirlo en los demas ejemplos seria mentir.
  if (status >= 500 && status !== 503) {
    ejemplo.incidentId = INCIDENTE;
  }

  return ejemplo;
}
