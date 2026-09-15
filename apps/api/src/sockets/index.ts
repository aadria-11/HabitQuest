import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';
import { JWTPayload } from '@shared/types';
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
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Unauthorized'));
    }

    try {
      const env = getEnv();
      const decoded = jwt.verify(token, env.AUTH_SECRET) as JWTPayload;
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    socket.on('subscribe', async () => {
      const userId = socket.data.userId as string;
      if (!userId) {
        return;
      }

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
