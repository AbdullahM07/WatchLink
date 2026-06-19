import type {
  AuthData,
  LoginInput,
  PublicUser,
  RegisterInput,
  UpdateProfileInput,
} from '@watchlink/shared';
import { apiFetch } from './api';

export function registerRequest(input: RegisterInput): Promise<AuthData> {
  return apiFetch<AuthData>('/auth/register', { method: 'POST', body: input, skipAuth: true });
}

export function loginRequest(input: LoginInput): Promise<AuthData> {
  return apiFetch<AuthData>('/auth/login', { method: 'POST', body: input, skipAuth: true });
}

export function fetchMe(): Promise<{ user: PublicUser }> {
  return apiFetch<{ user: PublicUser }>('/auth/me', { method: 'GET' });
}

export function updateProfileRequest(input: UpdateProfileInput): Promise<{ user: PublicUser }> {
  return apiFetch<{ user: PublicUser }>('/users/me', { method: 'PATCH', body: input });
}
