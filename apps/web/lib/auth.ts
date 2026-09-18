import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import jwt from 'jsonwebtoken';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || '';
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  secret: AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        console.log('[Auth JWT]', 'Provider:', account.provider, 'Email:', user.email);
        const syncResponse = await fetch(`${API_URL}/internal/users/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': INTERNAL_SECRET,
          },
          body: JSON.stringify({
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            email: user.email,
            name: user.name,
            image: user.image,
          }),
        });


        if (!syncResponse.ok) {
          const errorData = await syncResponse.text();
          console.error('Sync user failed:', { status: syncResponse.status, error: errorData, provider: account.provider });
          throw new Error(`Failed to sync user: ${syncResponse.status}`);
        }

        const syncData = await syncResponse.json();
        const { userId } = syncData;

        token.userId = userId;
        token.email = user.email;
        token.name = user.name;
      }

      if (token.userId) {
        const now = Math.floor(Date.now() / 1000);
        const tokenExpires = (token.apiTokenExpires as number) || 0;

        if (!token.apiToken || now + 120 > tokenExpires) {
          const expiresIn = 15 * 60;
          token.apiToken = jwt.sign(
            { userId: token.userId, email: token.email, name: token.name },
            AUTH_SECRET,
            { expiresIn },
          );
          token.apiTokenExpires = now + expiresIn;
        }
      }

      return token;
    },

    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.userId;
        session.apiToken = token.apiToken as string;
        console.log('Session callback - apiToken set:', !!session.apiToken, 'userId:', session.user.id);
      }
      return session;
    },
  },
});

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
    apiToken?: string;
  }
}
