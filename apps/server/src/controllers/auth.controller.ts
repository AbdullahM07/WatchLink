import type { Request, Response } from 'express';
import type { LoginInput, RegisterInput } from '@watchlink/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { getUserById, loginUser, registerUser } from '../services/auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await registerUser(req.body as RegisterInput);
  sendSuccess(res, result, 'Account created successfully', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginUser(req.body as LoginInput);
  sendSuccess(res, result, 'Logged in successfully');
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  // authenticate middleware guarantees req.auth exists.
  const user = await getUserById(req.auth!.sub);
  sendSuccess(res, { user }, 'OK');
});
