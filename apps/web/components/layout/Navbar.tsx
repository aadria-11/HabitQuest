'use client';

import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b-2 border-amber-700 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg p-2 group-hover:shadow-xl transition-all group-hover:scale-110 border-2 border-amber-400">
              <span className="text-2xl">⚔️</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-amber-400 group-hover:text-amber-300 transition-all" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
                HabitQuest
              </span>
              <span className="text-xs text-amber-300 font-medium tracking-widest">THE QUEST AWAITS</span>
            </div>
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
