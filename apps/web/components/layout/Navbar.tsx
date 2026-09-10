'use client';

import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900">Habit Tracker</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{session?.user?.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ redirectTo: '/login' })}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
