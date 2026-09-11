import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || '';
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '';

const CALLBACK_URL = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google` : 'http://localhost:3000/api/auth/callback/google';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          redirect_uri: CALLBACK_URL,
        },
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
  ],

  secret: AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: '/login',
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        try {
          const syncResponse = await fetch(`${API_URL}/internal/users/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': INTERNAL_SECRET,
            },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              image: user.image,
            }),
          });

          if (!syncResponse.ok) {
            throw new Error(`Failed to sync user: ${syncResponse.status}`);
          }

          const { userId } = await syncResponse.json();

          token.userId = userId;
          token.email = user.email;
          token.name = user.name;
        } catch (error) {
          console.error('[auth] sync error:', error instanceof Error ? error.message : String(error));
          throw error;
        }
      }

      return token;
    },

    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.userId;
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
  }
}
