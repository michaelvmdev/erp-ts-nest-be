import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUnitRequestDto {
  @ApiPropertyOptional({
    minLength: 1,
    maxLength: 100,
    example: 'Kilogramo',
    description: 'Nueva descripcion. El codigo (unitCode) es inmutable.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'unitDescription no puede estar vacio.' })
  @MaxLength(100, { message: 'unitDescription no puede superar 100 caracteres.' })
  unitDescription?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Enviar false desactiva la unidad sin borrarla.',
  })
  @IsOptional()
  @IsBoolean()
  unitActive?: boolean;
}
