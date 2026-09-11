import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-950 via-green-900 to-amber-950 relative overflow-hidden">
      {/* Decorative stars */}
      <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(2px 2px at 20% 30%, #d4af37, rgba(0,0,0,0)), radial-gradient(2px 2px at 60% 70%, #d4af37, rgba(0,0,0,0)), radial-gradient(1px 1px at 50% 50%, #d4af37, rgba(0,0,0,0))', backgroundSize: '200% 200%', backgroundPosition: '0 0'}}></div>

      <div className="w-full max-w-md rounded-xl bg-gradient-to-b from-amber-900 to-amber-950 p-8 shadow-2xl border-2 border-amber-700 relative">
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">⚔️</span>
          <h1 className="mb-2 text-4xl font-bold text-amber-400" style={{fontFamily: 'Georgia, serif', textShadow: '2px 2px 4px rgba(0,0,0,0.7)', letterSpacing: '0.05em'}}>HabitQuest</h1>
          <p className="text-amber-200 italic font-medium mb-1">&quot;A wizard is never late...&quot;</p>
          <p className="text-amber-300 text-xs font-semibold tracking-widest">Begin Your Epic Journey</p>
        </div>
        <p className="mb-8 text-amber-100 text-center text-sm">Embark on daily quests to become a master of your destiny</p>

        <div className="space-y-3">
          <form
            action={async () => {
              'use server';
              await signIn('github', { redirectTo: '/dashboard' });
            }}
          >
            <Button type="submit" className="w-full bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white font-bold border border-amber-500" size="lg">
              🛡️ Sign in with GitHub
            </Button>
          </form>

          <form
            action={async () => {
              'use server';
              await signIn('google', { redirectTo: '/dashboard' });
            }}
          >
            <Button type="submit" className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold border border-amber-400" size="lg">
              📜 Sign in with Google
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
