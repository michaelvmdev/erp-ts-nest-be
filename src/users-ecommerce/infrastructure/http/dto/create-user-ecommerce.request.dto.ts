import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateUserEcommerceRequestDto {
  @ApiProperty({
    example: 'carlos.garcia@gmail.com',
    description: 'Email del usuario. Debe ser unico. Se normaliza a minusculas.',
  })
  @IsEmail({}, { message: 'email debe ser una direccion de correo valida.' })
  @MaxLength(200)
  email!: string;

  @ApiProperty({ minLength: 1, maxLength: 100, example: 'Carlos' })
  @IsString()
  @MinLength(1, { message: 'firstName no puede estar vacio.' })
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ minLength: 1, maxLength: 100, example: 'Garcia Cano' })
  @IsString()
  @MinLength(1, { message: 'lastName no puede estar vacio.' })
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({
    example: '925234517',
    description: 'Telefono de contacto. Solo digitos, 7 a 20 caracteres. Opcional.',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o: CreateUserEcommerceRequestDto) => o.phone !== null)
  @IsString()
  @Matches(/^[0-9]{7,20}$/, { message: 'phone debe contener entre 7 y 20 digitos.' })
  phone?: string | null;

  @ApiPropertyOptional({ default: true, example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
