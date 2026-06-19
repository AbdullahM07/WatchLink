import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { PublicUser, Role } from '@watchlink/shared';
import { ROLES } from '@watchlink/shared';

export interface UserDoc {
  name: string;
  email: string;
  passwordHash: string;
  avatar: string | null;
  role: Role;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMethods {
  comparePassword(candidate: string): Promise<boolean>;
  toPublic(): PublicUser;
}

export type UserModel = Model<UserDoc, Record<string, never>, UserMethods>;
export type UserDocument = HydratedDocument<UserDoc, UserMethods>;

const userSchema = new Schema<UserDoc, UserModel, UserMethods>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 40 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    avatar: { type: String, default: null },
    role: { type: String, enum: ROLES, default: 'user' },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.methods.toPublic = function (): PublicUser {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const User = model<UserDoc, UserModel>('User', userSchema);

/** Hash a plaintext password with a sensible cost factor. */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}
