export interface JwtPayload {
  sub: string;
  email: string;
  roleId: string;
  iat?: number;
  exp?: number;
}
