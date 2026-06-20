'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tv } from 'lucide-react';
import { ROOM_CODE_LENGTH } from '@watchlink/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (clean.length === ROOM_CODE_LENGTH) router.push(`/room/${clean}`);
  };

  return (
    <div className="mx-auto max-w-md py-8 animate-fade-in">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Join a room</h1>
      <p className="mt-2 text-sm text-slate-300">Enter the {ROOM_CODE_LENGTH}-character room code.</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          icon={<Tv className="h-4 w-4" />}
          placeholder="ABC123"
          maxLength={ROOM_CODE_LENGTH}
          className="text-center font-mono text-lg tracking-[0.4em]"
          aria-label="Room code"
        />
        <Button type="submit" className="w-full" disabled={code.trim().length !== ROOM_CODE_LENGTH}>
          Join
        </Button>
      </form>
    </div>
  );
}
