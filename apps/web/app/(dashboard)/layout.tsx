import { SessionProvider } from 'next-auth/react';
import { Navbar } from '@/components/layout/Navbar';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { auth } from '@/lib/auth';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <SessionProvider session={session}>
      <QueryProvider>
        <SocketProvider>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
        </div>
      </SocketProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
