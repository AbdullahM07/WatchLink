'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Lock, Users } from 'lucide-react';
import { createRoomSchema, type CreateRoomInput } from '@watchlink/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { createRoomRequest } from '@/lib/rooms-api';
import { ApiClientError } from '@/lib/api';

export default function CreateRoomPage() {
  const { status } = useRequireAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: { name: '', isPrivate: false, maxParticipants: 20 },
  });

  const isPrivate = watch('isPrivate');

  useEffect(() => {
    if (status === 'guest') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') return <PageSpinner />;

  const onSubmit = async (values: CreateRoomInput) => {
    try {
      const payload: CreateRoomInput = {
        ...values,
        maxParticipants: Number(values.maxParticipants),
        password: values.isPrivate && values.password ? values.password : undefined,
      };
      const room = await createRoomRequest(payload);
      toast.success('Room created!');
      router.push(`/room/${room.roomCode}`);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Could not create room');
    }
  };

  return (
    <div className="mx-auto max-w-lg py-4 animate-fade-in">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Create a room</h1>
      <p className="mt-2 text-sm text-slate-300">Set it up, then share the invite link.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <Input label="Room name" placeholder="Friday Movie Night" error={errors.name?.message} {...register('name')} />

        <label className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-raised p-4">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" {...register('isPrivate')} />
          <span className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-slate-400" /> Private room
          </span>
        </label>

        {isPrivate && (
          <Input
            label="Password (optional)"
            type="password"
            placeholder="Leave empty for no password"
            error={errors.password?.message}
            {...register('password')}
          />
        )}

        <Input
          label="Max participants"
          type="number"
          min={2}
          max={50}
          icon={<Users className="h-4 w-4" />}
          error={errors.maxParticipants?.message}
          {...register('maxParticipants', { valueAsNumber: true })}
        />

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Create room
        </Button>
      </form>
    </div>
  );
}
