import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Cuerpo unico de error para toda la API.
 *
 * Que cada endpoint devuelva la misma forma ante cualquier fallo permite al
 * cliente escribir un solo manejador. `code` es el contrato estable para
 * decidir por programa; `message` es para que lo lea una persona.
 */
export class ApiErrorDto {
  @ApiProperty({ example: 404, description: 'Codigo de estado HTTP.' })
  statusCode!: number;

  @ApiProperty({
    example: 'PRODUCT_NOT_FOUND',
    description:
      'Identificador estable del error. Es la clave sobre la que debe ramificar el cliente; ' +
      'a diferencia del mensaje, no cambia con las reescrituras de texto.',
  })
  code!: string;

  @ApiProperty({
    example:
      'No existe un producto con id 3fa85f64-5717-4562-b3fc-2c963f66afa6.',
    description:
      'Explicacion legible. Puede ser una lista cuando falla la validacion del cuerpo.',
    type: 'string',
  })
  message!: string | string[];

  @ApiProperty({ example: '/products/3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  path!: string;

  @ApiProperty({ example: 'POST' })
  method!: string;

  @ApiProperty({ example: '2026-07-28T02:14:07.123Z', format: 'date-time' })
  timestamp!: string;

  @ApiPropertyOptional({
    description:
      'Identificador de la incidencia. Solo aparece en errores 500: permite cruzar lo que ve ' +
      'el cliente con la traza completa del log sin exponer detalles internos.',
    example: 'err_1c9a3f2b',
  })
  incidentId?: string;
}
