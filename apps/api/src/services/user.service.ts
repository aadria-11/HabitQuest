import { prisma } from '../lib/prisma.js';
import { User } from '@shared/types';

export async function syncUser(email: string, name?: string | null, image?: string | null): Promise<User> {
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, image },
    create: { email, name, image },
  });

  return user;
}

export async function getUser(userId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}
