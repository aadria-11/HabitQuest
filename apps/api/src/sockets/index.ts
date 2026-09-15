import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { hasValidSessionCookie } from '../middleware/auth.js';
import { evaluateMilestones } from '../services/milestone.service.js';
import { prisma } from '../lib/prisma.js';

export function setupSocketIO(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie;

    if (!hasValidSessionCookie(cookieHeader)) {
      return next(new Error('Unauthorized'));
    }

    next();
  });

  io.on('connection', (socket: Socket) => {
    socket.on('subscribe', async ({ userId }: { userId?: string }) => {
      if (!userId) {
        return;
      }

      socket.data.userId = userId;
      socket.join(`user:${userId}`);
      await evaluateMilestones(userId, io);
    });

    socket.on('milestone:ack', async ({ notificationId }) => {
      const userId = socket.data.userId as string | undefined;

      if (!userId || !notificationId) return;

      const notification = await prisma.milestoneNotification.findFirst({
        where: { id: notificationId, userId },
      });

      if (!notification) return;

      await prisma.milestoneNotification.update({
        where: { id: notificationId },
        data: { acknowledged: true },
      });
    });

    socket.on('disconnect', () => {
      // cleanup if needed
    });
  });

  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return (global as any).socketIO || null;
}

export function setSocketIO(io: SocketIOServer) {
  (global as any).socketIO = io;
}
