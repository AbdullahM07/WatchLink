import { AlertTriangle, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface ErrorPageProps {
  icon?: LucideIcon;
  title: string;
  message: string;
  actions: ReactNode;
}

/** Full-page error screen: icon, headline, message, actions. Used by app/error.tsx and room load failures. */
export function ErrorPage({ icon: Icon = AlertTriangle, title, message, actions }: ErrorPageProps) {
  return (
    <div className="mx-auto max-w-md py-16 text-center animate-fade-in">
      <Icon className="mx-auto h-12 w-12 text-amber-400" aria-hidden />
      <h1 className="mt-4 text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-slate-400">{message}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{actions}</div>
    </div>
  );
}
