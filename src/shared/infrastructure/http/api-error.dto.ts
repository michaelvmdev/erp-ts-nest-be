import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Cuerpo unico de error para toda la API.
 *
 * Que cada endpoint devuelva la misma forma ante cualquier fallo permite al
 * cliente escribir un solo manejador. `code` es el contrato estable para
 * decidir por programa; `message` es para que lo lea una persona.
 *
 * Los `example` de aqui describen la forma del objeto, no un caso concreto: cada
 * respuesta de Swagger trae su propio ejemplo ajustado a su codigo de estado y a
 * su ruta, generado en error-examples.ts.
 */
export class ApiErrorDto {
  @ApiProperty({
    type: 'integer',
    example: 400,
    description:
      'Codigo de estado HTTP, repetido en el cuerpo para no depender de la cabecera.',
  })
  statusCode!: number;

  @ApiProperty({
    example: 'VALIDATION_ERROR',
    description:
      'Identificador estable del error. Es la clave sobre la que debe ramificar el cliente; ' +
      'a diferencia del mensaje, no cambia con las reescrituras de texto.',
  })
  code!: string;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example:
      'documentNumber debe tener 8 u 11 digitos, sin letras ni separadores.',
    description:
      'Explicacion legible. Es un texto cuando el error viene del dominio, y una lista ' +
      'cuando la validacion del cuerpo acumula varios campos invalidos.',
  })
  message!: string | string[];

  @ApiProperty({
    example: '/clients',
    description: 'Ruta que se solicito, con los parametros ya resueltos.',
  })
  path!: string;

  @ApiProperty({ example: 'POST', description: 'Metodo HTTP de la peticion.' })
  method!: string;

  @ApiProperty({
    example: '2026-07-28T02:14:07.123Z',
    format: 'date-time',
    description: 'Momento en que se genero la respuesta, en UTC.',
  })
  timestamp!: string;

  @ApiPropertyOptional({
    example: 'err_1c9a3f2b',
    description:
      'Identificador de la incidencia. **Solo aparece en los errores 500**: permite cruzar ' +
      'lo que ve el cliente con la traza completa del log sin exponer detalles internos. ' +
      'En el resto de los codigos el campo no viene.',
  })
  incidentId?: string;
}
