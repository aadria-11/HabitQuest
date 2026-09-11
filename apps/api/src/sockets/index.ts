import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { extractToken } from '../middleware/auth.js';
import { JWTPayload } from '@shared/types';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';
import { evaluateMilestones } from '../services/milestone.service.js';
import { prisma } from '../lib/prisma.js';

export function setupSocketIO(httpServer: HTTPServer): SocketIOServer {
  const env = getEnv();
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });
/*temporary removal
  io.use((socket, next) => {
    const token = extractToken({
      headers: { cookie: socket.handshake.headers.cookie },
    } as any);

    if (!token) {
      return next(new Error('Unauthorized'));
    }

    try {
      const decoded = jwt.verify(token, env.AUTH_SECRET) as JWTPayload;
      (socket as any).userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Unauthorized'));
    }
  });
  */
 
  io.use((socket, next) => {
    next();
  });

  io.on('connection', (socket: Socket) => {

    socket.on('subscribe', async ({ userId }) => {
      console.log('User subscribed:', userId);

      socket.join(`user:${userId}`);

      await evaluateMilestones(userId, socket);
    });

    socket.on('milestone:ack',async ({ notificationId }) => {
      await prisma.milestoneNotification.update({
        where: {id: notificationId,},
        data: {acknowledged: true,},
        });

        console.log('Notification acknowledged:',notificationId,);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
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
