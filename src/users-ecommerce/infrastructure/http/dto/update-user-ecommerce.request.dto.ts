import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateUserEcommerceRequestDto {
  @ApiPropertyOptional({ example: 'nuevo.email@gmail.com' })
  @IsOptional()
  @IsEmail({}, { message: 'email debe ser una direccion de correo valida.' })
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 100, example: 'Carlos' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 100, example: 'Garcia Cano' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({
    example: '925234517',
    nullable: true,
    description: 'Enviar null para borrar el telefono.',
  })
  @IsOptional()
  @ValidateIf((o: UpdateUserEcommerceRequestDto) => o.phone !== null)
  @IsString()
  @Matches(/^[0-9]{7,20}$/, { message: 'phone debe contener entre 7 y 20 digitos.' })
  phone?: string | null;

  @ApiPropertyOptional({
    example: false,
    description: 'false desactiva el usuario, true lo reactiva.',
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
