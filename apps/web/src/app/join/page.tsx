'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROOM_CODE_LENGTH } from '@watchlink/shared';
import { Button } from '@/components/ui/Button';
import { CodeInput } from '@/components/ui/CodeInput';

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const go = (value: string) => {
    if (value.length === ROOM_CODE_LENGTH) router.push(`/room/${value}`);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    go(code);
  };

  return (
    <div className="mx-auto max-w-md py-10 animate-fade-in">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Join a room</h1>
      <p className="mt-2 text-sm text-slate-300">Enter the {ROOM_CODE_LENGTH}-character room code.</p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <CodeInput
          value={code}
          onChange={setCode}
          length={ROOM_CODE_LENGTH}
          onComplete={go}
          autoFocus
          aria-label="Room code"
        />
        <Button type="submit" className="w-full" disabled={code.length !== ROOM_CODE_LENGTH}>
          Join
        </Button>
      </form>
    </div>
  );
}
