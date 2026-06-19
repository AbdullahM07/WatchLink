import type { Request, Response } from 'express';
import type { UpdateProfileInput } from '@watchlink/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/User';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.auth!.sub);
  if (!user) throw ApiError.notFound('User not found');
  sendSuccess(res, { user: user.toPublic() }, 'OK');
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateProfileInput;
  const user = await User.findById(req.auth!.sub);
  if (!user) throw ApiError.notFound('User not found');

  if (input.name !== undefined) user.name = input.name;
  if (input.avatar !== undefined) user.avatar = input.avatar;
  await user.save();

  sendSuccess(res, { user: user.toPublic() }, 'Profile updated');
});
