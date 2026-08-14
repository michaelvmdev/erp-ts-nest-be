export interface JwtPayload {
  sub: string;
  email: string;
  roleId: string;
  roleName: string;
  type: 'access';
  iat?: number;
  exp?: number;
}
