import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { User, UserEmailConflictError } from '../domain/user';
import { USER_REPOSITORY } from '../domain/user.repository';
import { RegisterUserUseCase } from './register-user.use-case';

const ROLE_ID = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const EMAIL   = 'nuevo@test.com';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let userRepo: { findByEmail: jest.Mock; insert: jest.Mock };

  beforeEach(async () => {
    userRepo = { findByEmail: jest.fn(), insert: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        { provide: USER_REPOSITORY, useValue: userRepo },
      ],
    }).compile();

    useCase = module.get(RegisterUserUseCase);
  });

  it('throws UserEmailConflictError when email is already taken', async () => {
    userRepo.findByEmail.mockResolvedValue({ email: EMAIL });

    await expect(
      useCase.run({ roleId: ROLE_ID, email: EMAIL, name: 'Test', password: 'pass123!' }),
    ).rejects.toThrow(UserEmailConflictError);

    expect(userRepo.insert).not.toHaveBeenCalled();
  });

  it('creates and persists a new user when email is free', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.insert.mockResolvedValue(undefined);

    const user = await useCase.run({ roleId: ROLE_ID, email: EMAIL, name: 'Nuevo', password: 'pass123!' });

    expect(user).toBeInstanceOf(User);
    expect(userRepo.insert).toHaveBeenCalledTimes(1);
  });

  it('stores a bcrypt hash, not the raw password', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.insert.mockResolvedValue(undefined);

    const user = await useCase.run({ roleId: ROLE_ID, email: EMAIL, name: 'Test', password: 'mypassword' });
    const snap = user.toSnapshot();

    expect(snap.passwordHash).not.toBe('mypassword');
    const valid = await bcrypt.compare('mypassword', snap.passwordHash);
    expect(valid).toBe(true);
  });

  it('normalises email to lower-case', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.insert.mockResolvedValue(undefined);

    const user = await useCase.run({ roleId: ROLE_ID, email: 'Upper@TEST.COM', name: 'Test', password: 'x1234567' });
    const snap = user.toSnapshot();

    expect(snap.email).toBe('upper@test.com');
  });

  it('creates user in active state', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.insert.mockResolvedValue(undefined);

    const user = await useCase.run({ roleId: ROLE_ID, email: EMAIL, name: 'Test', password: 'x1234567' });

    expect(user.active).toBe(true);
  });
});
