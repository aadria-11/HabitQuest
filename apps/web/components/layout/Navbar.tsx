'use client';

import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b border-slate-200 bg-gradient-to-r from-white to-blue-50 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2 group-hover:shadow-lg transition-shadow">
              <span className="text-xl">✨</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:to-purple-500 transition-all">Habit Tracker</span>
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
