'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clapperboard, LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const { user, status, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border/70 bg-surface/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-90"
        >
          <Clapperboard className="h-6 w-6 text-accent-400" />
          <span className="font-display text-xl font-semibold tracking-tight">
            Watch<span className="text-brand-300">Link</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {status === 'authenticated' && user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="secondary" size="sm">
                  <UserIcon className="h-4 w-4" />
                  {user.name}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : status === 'guest' ? (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
