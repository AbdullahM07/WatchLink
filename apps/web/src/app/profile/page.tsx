'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Image as ImageIcon, User as UserIcon } from 'lucide-react';
import { updateProfileSchema, type UpdateProfileInput } from '@watchlink/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { updateProfileRequest } from '@/lib/auth-api';
import { ApiClientError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function ProfilePage() {
  const { status, user } = useRequireAuth();
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    values: user ? { name: user.name, avatar: user.avatar } : undefined,
  });

  useEffect(() => {
    if (user) reset({ name: user.name, avatar: user.avatar });
  }, [user, reset]);

  if (status !== 'authenticated' || !user) return <PageSpinner />;

  const onSubmit = async (values: UpdateProfileInput) => {
    try {
      const payload: UpdateProfileInput = {
        name: values.name,
        avatar: values.avatar?.trim() ? values.avatar.trim() : null,
      };
      const { user: updated } = await updateProfileRequest(payload);
      setUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Update failed');
    }
  };

  const initials = user.name.slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-lg py-4 animate-fade-in">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-2 text-sm text-slate-300">Manage how others see you in rooms.</p>

      <div className="mt-6 flex items-center gap-4">
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600/20 text-lg font-semibold text-brand-200">
            {initials}
          </div>
        )}
        <div>
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-slate-400">{user.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <Input
          label="Display name"
          icon={<UserIcon className="h-4 w-4" />}
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Avatar URL (optional)"
          placeholder="https://…"
          icon={<ImageIcon className="h-4 w-4" />}
          error={errors.avatar?.message}
          {...register('avatar')}
        />
        <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
          Save changes
        </Button>
      </form>
    </div>
  );
}
