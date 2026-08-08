import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUnitRequestDto {
  @ApiProperty({
    minLength: 1,
    maxLength: 10,
    example: 'KG',
    description:
      'Codigo de la unidad. Solo letras mayusculas y digitos (A-Z, 0-9), maximo 10 caracteres. ' +
      'Se convierte a mayusculas antes de guardarse.',
  })
  @IsString()
  @MinLength(1, { message: 'unitCode no puede estar vacio.' })
  @MaxLength(10, { message: 'unitCode no puede superar 10 caracteres.' })
  @Matches(/^[A-Za-z0-9]+$/, { message: 'unitCode solo puede contener letras y digitos.' })
  unitCode!: string;

  @ApiProperty({
    minLength: 1,
    maxLength: 100,
    example: 'Kilogramo',
    description: 'Nombre descriptivo de la unidad de medida.',
  })
  @IsString()
  @MinLength(1, { message: 'unitDescription no puede estar vacio.' })
  @MaxLength(100, { message: 'unitDescription no puede superar 100 caracteres.' })
  unitDescription!: string;

  @ApiPropertyOptional({ default: true, example: true })
  @IsOptional()
  @IsBoolean()
  unitActive?: boolean;
}
