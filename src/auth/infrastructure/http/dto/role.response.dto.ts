import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../domain/role';

export class RoleResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) description!: string | null;

  static fromDomain(role: Role): RoleResponseDto {
    const snap = role.toSnapshot();
    const dto = new RoleResponseDto();
    dto.id = snap.id;
    dto.name = snap.name;
    dto.description = snap.description;
    return dto;
  }
}
