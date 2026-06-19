'use client';

import { useState } from 'react';
import { KeyRound, LogIn, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Props {
  roomName: string;
  needName: boolean;
  needPassword: boolean;
  pending: boolean;
  error?: string | null;
  onSubmit: (creds: { guestName?: string; password?: string }) => void;
}

export function JoinGate({ roomName, needName, needPassword, pending, error, onSubmit }: Props) {
  const [guestName, setGuestName] = useState('');
  const [password, setPassword] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      guestName: needName ? guestName.trim() || 'Guest' : undefined,
      password: needPassword ? password : undefined,
    });
  };

  return (
    <div className="mx-auto max-w-md py-10 animate-fade-in">
      <div className="rounded-2xl border border-surface-border bg-surface-raised/60 p-6">
        <h1 className="text-xl font-semibold">Join “{roomName}”</h1>
        <p className="mt-1 text-sm text-slate-400">
          {needName ? 'Pick a name to join as a guest.' : 'Ready when you are.'}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {needName && (
            <Input
              label="Your name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              icon={<UserIcon className="h-4 w-4" />}
              placeholder="Guest"
              maxLength={40}
            />
          )}
          {needPassword && (
            <Input
              label="Room password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<KeyRound className="h-4 w-4" />}
            />
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" isLoading={pending}>
            <LogIn className="h-4 w-4" /> Join room
          </Button>
        </form>
      </div>
    </div>
  );
}
