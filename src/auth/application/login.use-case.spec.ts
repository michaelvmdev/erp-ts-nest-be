import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { InvalidCredentialsError } from '../domain/user';
import { ROLE_REPOSITORY } from '../domain/role.repository';
import { USER_REPOSITORY } from '../domain/user.repository';
import { LoginUseCase } from './login.use-case';

const USER_ID  = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const ROLE_ID  = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const EMAIL    = 'admin@test.com';
const PASSWORD = 'secret123';

async function makeUser(overrides: Partial<{ active: boolean; passwordHash: string }> = {}) {
  const hash = overrides.passwordHash ?? await bcrypt.hash(PASSWORD, 10);
  return {
    id: { value: USER_ID },
    email: EMAIL,
    roleId: ROLE_ID,
    passwordHash: hash,
    active: overrides.active ?? true,
  };
}

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepo: { findByEmail: jest.Mock };
  let roleRepo: { findById: jest.Mock };

  beforeEach(async () => {
    userRepo = { findByEmail: jest.fn() };
    roleRepo = { findById: jest.fn().mockResolvedValue({ name: 'administrador' }) };

    const module = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '1h' } })],
      providers: [
        LoginUseCase,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: ROLE_REPOSITORY, useValue: roleRepo },
      ],
    }).compile();

    useCase = module.get(LoginUseCase);
  });

  it('throws InvalidCredentialsError when user does not exist', async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    await expect(useCase.run({ email: EMAIL, password: PASSWORD }))
      .rejects.toThrow(InvalidCredentialsError);
  });

  it('throws InvalidCredentialsError when user is inactive', async () => {
    userRepo.findByEmail.mockResolvedValue(await makeUser({ active: false }));

    await expect(useCase.run({ email: EMAIL, password: PASSWORD }))
      .rejects.toThrow(InvalidCredentialsError);
  });

  it('throws InvalidCredentialsError when password is wrong', async () => {
    userRepo.findByEmail.mockResolvedValue(await makeUser());

    await expect(useCase.run({ email: EMAIL, password: 'wrong-password' }))
      .rejects.toThrow(InvalidCredentialsError);
  });

  it('returns accessToken, refreshToken and user data on valid credentials', async () => {
    userRepo.findByEmail.mockResolvedValue(await makeUser());

    const result = await useCase.run({ email: EMAIL, password: PASSWORD });

    expect(typeof result.accessToken).toBe('string');
    expect(typeof result.refreshToken).toBe('string');
    expect(result.userId).toBe(USER_ID);
    expect(result.email).toBe(EMAIL);
    expect(result.roleId).toBe(ROLE_ID);
  });

  it('calls roles.findById to include roleName in the token', async () => {
    userRepo.findByEmail.mockResolvedValue(await makeUser());

    await useCase.run({ email: EMAIL, password: PASSWORD });

    expect(roleRepo.findById).toHaveBeenCalledTimes(1);
  });

  it('returns tokens with correct JWT structure (3 dot-separated segments)', async () => {
    userRepo.findByEmail.mockResolvedValue(await makeUser());

    const { accessToken, refreshToken } = await useCase.run({ email: EMAIL, password: PASSWORD });

    expect(accessToken.split('.')).toHaveLength(3);
    expect(refreshToken.split('.')).toHaveLength(3);
  });

  it('access token payload contains sub, email, roleId and type=access', async () => {
    userRepo.findByEmail.mockResolvedValue(await makeUser());
    const jwtService = (useCase as any).jwtService as JwtService;

    const { accessToken } = await useCase.run({ email: EMAIL, password: PASSWORD });
    const payload = jwtService.decode(accessToken) as Record<string, unknown>;

    expect(payload.sub).toBe(USER_ID);
    expect(payload.email).toBe(EMAIL);
    expect(payload.roleId).toBe(ROLE_ID);
    expect(payload.type).toBe('access');
  });
});
