'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Lock, Mail, User as UserIcon } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@watchlink/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { registerRequest } from '@/lib/auth-api';
import { ApiClientError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { login, status } = useAuthStore();

  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard');
  }, [status, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterInput) => {
    try {
      const { token, user } = await registerRequest(values);
      login(token, user);
      toast.success(`Welcome, ${user.name}!`);
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="mx-auto max-w-md py-8 animate-fade-in">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-slate-300">Free, and takes a few seconds.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <Input
          label="Name"
          autoComplete="name"
          icon={<UserIcon className="h-4 w-4" />}
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          icon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          icon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand-300 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
