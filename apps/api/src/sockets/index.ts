import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { extractToken } from '../middleware/auth.js';
import { JWTPayload } from '@shared/types';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';

export function setupSocketIO(httpServer: HTTPServer): SocketIOServer {
  const env = getEnv();
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

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

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      socket.leave(`user:${userId}`);
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
