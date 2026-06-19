import type { LoginInput, PublicUser, RegisterInput } from '@watchlink/shared';
import { ApiError } from '../utils/ApiError';
import { signAccessToken } from '../utils/jwt';
import { User, hashPassword, type UserDocument } from '../models/User';

export interface AuthResult {
  user: PublicUser;
  token: string;
}

function issue(user: UserDocument): AuthResult {
  return {
    user: user.toPublic(),
    token: signAccessToken({ sub: user.id, role: user.role }),
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existing = await User.findOne({ email: input.email }).lean();
  if (existing) {
    throw ApiError.conflict('An account with that email already exists', 'EMAIL_TAKEN');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  return issue(user);
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  // passwordHash has `select: false`, so explicitly include it.
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password', 'BAD_CREDENTIALS');
  }
  if (user.isBlocked) {
    throw ApiError.forbidden('This account has been blocked', 'BLOCKED');
  }

  const ok = await user.comparePassword(input.password);
  if (!ok) {
    throw ApiError.unauthorized('Invalid email or password', 'BAD_CREDENTIALS');
  }

  return issue(user);
}

export async function getUserById(id: string): Promise<PublicUser> {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
  return user.toPublic();
}
