import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';
import EntraProvider from 'next-auth/providers/azure-ad';
import { JWTPayload } from '@shared/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || '';
const AUTH_SECRET = process.env.AUTH_SECRET || '';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    EntraProvider({
      clientId: process.env.ENTRA_ID_CLIENT_ID || '',
      clientSecret: process.env.ENTRA_ID_CLIENT_SECRET || '',
      tenantId: process.env.ENTRA_ID_TENANT || 'common',
    }),
  ],
  basePath: '/auth',
  secret: AUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        // First login: sync user with API
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
          throw new Error('Failed to sync user');
        }

        const { userId } = await syncResponse.json();

        token.userId = userId;
        token.email = user.email;
        token.name = user.name;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});

declare module 'next-auth' {
  interface User {
    id: string;
  }

  interface Session {
    user: Session['user'] & {
      id: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
  }
}
