import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../domain/user';

export class UserResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() roleId!: string;
  @ApiProperty() roleName!: string;
  @ApiProperty() email!: string;
  @ApiProperty() name!: string;
  @ApiProperty() active!: boolean;
  @ApiProperty() createdAt!: Date;

  static fromDomain(user: User, roleName = ''): UserResponseDto {
    const snap = user.toSnapshot();
    const dto = new UserResponseDto();
    dto.id = snap.id;
    dto.roleId = snap.roleId;
    dto.roleName = roleName;
    dto.email = snap.email;
    dto.name = snap.name;
    dto.active = snap.active;
    dto.createdAt = snap.createdAt;
    return dto;
  }
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] }) items!: UserResponseDto[];
  @ApiProperty() meta!: {
    page: number; limit: number; total: number;
    totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean;
  };
}
