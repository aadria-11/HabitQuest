import { prisma } from '../lib/prisma.js';
import { User } from '@shared/types';

interface SyncUserInput {
  provider: string;
  providerAccountId: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

export async function syncUser({
  provider,
  providerAccountId,
  email,
  name,
  image,
}: SyncUserInput): Promise<User> {
  const user = await prisma.user.upsert({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    update: { email, name, image },
    create: { provider, providerAccountId, email, name, image },
  });

  return user;
}

export async function getUser(userId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}
