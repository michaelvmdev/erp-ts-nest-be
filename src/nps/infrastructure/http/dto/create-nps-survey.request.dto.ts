import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateNpsSurveyRequestDto {
  @ApiProperty({
    format: 'uuid',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    description: 'Identificador de la venta a la que pertenece esta encuesta.',
  })
  @IsUUID('4', { message: 'saleId debe ser un UUID v4 valido.' })
  saleId!: string;

  @ApiProperty({
    minimum: 0,
    maximum: 10,
    example: 9,
    description:
      'Puntuacion de 0 a 10. Promotores: 9-10 | Pasivos: 7-8 | Detractores: 0-6.',
  })
  @IsInt({ message: 'score debe ser un entero.' })
  @Min(0, { message: 'score no puede ser menor que 0.' })
  @Max(10, { message: 'score no puede ser mayor que 10.' })
  score!: number;

  @ApiPropertyOptional({
    maxLength: 1000,
    example: 'La entrega fue muy rapida y el producto llego en perfectas condiciones.',
    description: 'Comentario libre y opcional del cliente.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'comment no puede superar 1000 caracteres.' })
  comment?: string;
}
