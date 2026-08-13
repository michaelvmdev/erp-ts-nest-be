import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../../../../products/infrastructure/http/dto/product.response.dto';
import { UserEcommerce } from '../../../domain/user-ecommerce';

export class UserEcommerceResponseDto {
  @ApiProperty({ format: 'uuid', example: '181e2a56-6b4b-42b1-9e56-5ecf0bbf47b3' })
  userEcommerceId!: string;

  @ApiProperty({ example: 'carlos.garcia@gmail.com' })
  email!: string;

  @ApiProperty({ maxLength: 100, example: 'Carlos' })
  firstName!: string;

  @ApiProperty({ maxLength: 100, example: 'Garcia Cano' })
  lastName!: string;

  @ApiProperty({ example: '925234517', nullable: true })
  phone!: string | null;

  @ApiProperty({ example: true })
  userActive!: boolean;

  @ApiProperty({ format: 'date-time', example: '2026-04-26T00:00:00.000Z' })
  createdAt!: string;

  static fromDomain(user: UserEcommerce): UserEcommerceResponseDto {
    const s = user.toSnapshot();
    const dto = new UserEcommerceResponseDto();
    dto.userEcommerceId = s.id;
    dto.email = s.email;
    dto.firstName = s.firstName;
    dto.lastName = s.lastName;
    dto.phone = s.phone;
    dto.userActive = s.active;
    dto.createdAt = s.createdAt.toISOString();
    return dto;
  }
}

export class PaginatedUsersEcommerceResponseDto {
  @ApiProperty({ type: [UserEcommerceResponseDto] })
  items!: UserEcommerceResponseDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}
