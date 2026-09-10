import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">Habit Tracker</h1>
        <p className="mb-8 text-slate-600">Track your daily habits and build better routines</p>

        <form
          action={async () => {
            'use server';
            await signIn('github', { redirectTo: '/dashboard' });
          }}
        >
          <Button type="submit" className="w-full" size="lg">
            Sign in with GitHub
          </Button>
        </form>
      </div>
    </div>
  );
}
