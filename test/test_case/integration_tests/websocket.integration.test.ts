import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import http from 'http';

describe('WebSocket Integration Tests', () => {
  let server: http.Server;
  let serverSocket: SocketIOServer;
  let clientSocket: ClientSocket;
  const PORT = 3001;

  beforeEach(async () => {
    server = http.createServer();
    serverSocket = new SocketIOServer(server, {
      cors: { origin: '*' },
    });

    await new Promise<void>(resolve => {
      server.listen(PORT, () => resolve());
    });

    clientSocket = ioClient(`http://localhost:${PORT}`, {
      reconnection: true,
    });

    await new Promise<void>(resolve => {
      clientSocket.on('connect', resolve);
    });
  });

  afterEach(async () => {
    clientSocket.disconnect();
    serverSocket.close();
    server.close();
  });

  describe('Connection Management', () => {
    it('should establish WebSocket connection', () => {
      expect(clientSocket.connected).toBe(true);
    });

    it('should assign socket ID on connection', () => {
      expect(clientSocket.id).toBeDefined();
      expect(clientSocket.id).not.toBe('');
    });

    it('should handle disconnection', async () => {
      clientSocket.disconnect();

      await new Promise<void>(resolve => {
        clientSocket.on('disconnect', resolve);
      });

      expect(clientSocket.connected).toBe(false);
    });

    it('should handle reconnection', async () => {
      clientSocket.disconnect();

      const newSocket = ioClient(`http://localhost:${PORT}`);

      await new Promise<void>(resolve => {
        newSocket.on('connect', resolve);
      });

      expect(newSocket.connected).toBe(true);
      newSocket.disconnect();
    });
  });

  describe('Habit Events - Server to Client', () => {
    it('should receive habit:created event', async () => {
      const habitData = {
        id: 'habit-1',
        name: 'Morning Run',
        userId: 'user-123',
      };

      serverSocket.on('connection', socket => {
        socket.emit('habit:created', habitData);
      });

      await new Promise<void>(resolve => {
        clientSocket.on('habit:created', data => {
          expect(data).toEqual(habitData);
          resolve();
        });
      });
    });

    it('should receive habit:updated event', async () => {
      const habitData = {
        id: 'habit-1',
        name: 'Updated Run',
        status: 'paused',
      };

      serverSocket.on('connection', socket => {
        socket.emit('habit:updated', habitData);
      });

      await new Promise<void>(resolve => {
        clientSocket.on('habit:updated', data => {
          expect(data).toEqual(habitData);
          resolve();
        });
      });
    });

    it('should receive habit:deleted event', async () => {
      const habitId = 'habit-1';

      serverSocket.on('connection', socket => {
        socket.emit('habit:deleted', { id: habitId });
      });

      await new Promise<void>(resolve => {
        clientSocket.on('habit:deleted', data => {
          expect(data.id).toBe(habitId);
          resolve();
        });
      });
    });

    it('should receive habit:checkedin event', async () => {
      const checkInData = {
        id: 'checkin-1',
        habitId: 'habit-1',
        checkInDate: new Date(),
      };

      serverSocket.on('connection', socket => {
        socket.emit('habit:checkedin', checkInData);
      });

      await new Promise<void>(resolve => {
        clientSocket.on('habit:checkedin', data => {
          expect(data.habitId).toBe('habit-1');
          resolve();
        });
      });
    });

    it('should receive streak:updated event', async () => {
      const streakData = {
        habitId: 'habit-1',
        currentStreak: 5,
        bestStreak: 10,
      };

      serverSocket.on('connection', socket => {
        socket.emit('streak:updated', streakData);
      });

      await new Promise<void>(resolve => {
        clientSocket.on('streak:updated', data => {
          expect(data.currentStreak).toBe(5);
          expect(data.bestStreak).toBe(10);
          resolve();
        });
      });
    });
  });

  describe('Habit Events - Client to Server', () => {
    it('should send habit:subscribe event', async () => {
      const subscriptionData = { habitId: 'habit-1', userId: 'user-123' };

      serverSocket.on('connection', socket => {
        socket.on('habit:subscribe', data => {
          expect(data).toEqual(subscriptionData);
        });
      });

      clientSocket.emit('habit:subscribe', subscriptionData);

      await new Promise<void>(resolve => {
        setTimeout(resolve, 100);
      });
    });

    it('should send habit:update event', async () => {
      const updateData = {
        id: 'habit-1',
        name: 'Updated Name',
        status: 'paused',
      };

      serverSocket.on('connection', socket => {
        socket.on('habit:update', data => {
          expect(data).toEqual(updateData);
        });
      });

      clientSocket.emit('habit:update', updateData);

      await new Promise<void>(resolve => {
        setTimeout(resolve, 100);
      });
    });

    it('should send habit:checkin event', async () => {
      const checkInData = {
        habitId: 'habit-1',
        userId: 'user-123',
        date: new Date().toISOString().split('T')[0],
      };

      serverSocket.on('connection', socket => {
        socket.on('habit:checkin', data => {
          expect(data.habitId).toBe('habit-1');
          expect(data.userId).toBe('user-123');
        });
      });

      clientSocket.emit('habit:checkin', checkInData);

      await new Promise<void>(resolve => {
        setTimeout(resolve, 100);
      });
    });
  });

  describe('Real-time Synchronization', () => {
    it('should broadcast habit creation to multiple clients', async () => {
      const client1 = ioClient(`http://localhost:${PORT}`);
      const client2 = ioClient(`http://localhost:${PORT}`);

      await new Promise<void>(resolve => {
        let connected = 0;
        const checkConnected = () => {
          connected++;
          if (connected === 2) resolve();
        };
        client1.on('connect', checkConnected);
        client2.on('connect', checkConnected);
      });

      const habitData = { id: 'habit-1', name: 'Shared Habit' };

      let receivedOnClient1 = false;
      let receivedOnClient2 = false;

      client1.on('habit:created', () => {
        receivedOnClient1 = true;
      });

      client2.on('habit:created', () => {
        receivedOnClient2 = true;
      });

      serverSocket.on('connection', socket => {
        serverSocket.emit('habit:created', habitData);
      });

      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 200);
      });

      expect(receivedOnClient1 || receivedOnClient2).toBe(true);

      client1.disconnect();
      client2.disconnect();
    });

    it('should update habit state across tabs simultaneously', async () => {
      const tab1 = ioClient(`http://localhost:${PORT}`);
      const tab2 = ioClient(`http://localhost:${PORT}`);

      await new Promise<void>(resolve => {
        let connected = 0;
        const checkConnected = () => {
          connected++;
          if (connected === 2) resolve();
        };
        tab1.on('connect', checkConnected);
        tab2.on('connect', checkConnected);
      });

      const updateData = { id: 'habit-1', status: 'paused' };

      tab1.emit('habit:update', updateData);

      await new Promise<void>(resolve => {
        tab2.on('habit:updated', data => {
          expect(data.status).toBe('paused');
          resolve();
        });

        serverSocket.on('connection', socket => {
          socket.on('habit:update', () => {
            serverSocket.emit('habit:updated', updateData);
          });
        });
      });

      tab1.disconnect();
      tab2.disconnect();
    });

    it('should sync check-in across sessions', async () => {
      const session1 = ioClient(`http://localhost:${PORT}`);
      const session2 = ioClient(`http://localhost:${PORT}`);

      await new Promise<void>(resolve => {
        let connected = 0;
        const checkConnected = () => {
          connected++;
          if (connected === 2) resolve();
        };
        session1.on('connect', checkConnected);
        session2.on('connect', checkConnected);
      });

      const checkInData = {
        id: 'checkin-1',
        habitId: 'habit-1',
        checkInDate: new Date(),
      };

      let receivedCheckIn = false;

      session2.on('habit:checkedin', () => {
        receivedCheckIn = true;
      });

      session1.emit('habit:checkin', {
        habitId: 'habit-1',
        userId: 'user-123',
      });

      serverSocket.on('connection', socket => {
        socket.on('habit:checkin', () => {
          serverSocket.emit('habit:checkedin', checkInData);
          serverSocket.emit('streak:updated', {
            habitId: 'habit-1',
            currentStreak: 1,
            bestStreak: 1,
          });
        });
      });

      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 200);
      });

      expect(receivedCheckIn).toBe(true);

      session1.disconnect();
      session2.disconnect();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid event data', async () => {
      const invalidData = { habitId: 'habit-1' };

      serverSocket.on('connection', socket => {
        socket.on('habit:update', data => {
          if (!data.id) {
            socket.emit('error', { message: 'Invalid habit ID' });
          }
        });
      });

      clientSocket.emit('habit:update', invalidData);

      await new Promise<void>(resolve => {
        clientSocket.on('error', error => {
          expect(error.message).toBe('Invalid habit ID');
          resolve();
        });
      });
    });

    it('should handle connection timeout', async () => {
      const slowClient = ioClient(`http://localhost:${PORT}`, {
        reconnectionDelay: 100,
        reconnection: true,
      });

      // Simulate timeout
      slowClient.io.engine.close();

      await new Promise<void>(resolve => {
        slowClient.on('disconnect', () => {
          expect(slowClient.connected).toBe(false);
          resolve();
        });
      });

      slowClient.disconnect();
    });
  });

  describe('Authentication in WebSocket', () => {
    it('should verify user before accepting events', async () => {
      let eventReceived = false;

      serverSocket.on('connection', socket => {
        socket.on('habit:checkin', data => {
          // Verify userId matches authenticated user
          const userId = socket.handshake.auth?.userId;
          if (userId && userId === 'user-123') {
            eventReceived = true;
            socket.emit('success');
          }
        });
      });

      const authSocket = ioClient(`http://localhost:${PORT}`, {
        auth: { userId: 'user-123' },
      });

      await new Promise<void>(resolve => {
        authSocket.on('connect', () => {
          authSocket.emit('habit:checkin', {
            habitId: 'habit-1',
            userId: 'user-123',
          });

          authSocket.on('success', () => {
            expect(eventReceived).toBe(true);
            authSocket.disconnect();
            resolve();
          });
        });
      });
    });

    it('should reject events from unauthorized users', async () => {
      serverSocket.on('connection', socket => {
        socket.on('habit:update', data => {
          const userId = socket.handshake.auth?.userId;
          if (!userId || userId !== data.userId) {
            socket.emit('error', { message: 'Unauthorized' });
          }
        });
      });

      const unauthorizedSocket = ioClient(`http://localhost:${PORT}`, {
        auth: { userId: 'user-456' },
      });

      await new Promise<void>(resolve => {
        unauthorizedSocket.on('connect', () => {
          unauthorizedSocket.emit('habit:update', {
            id: 'habit-1',
            userId: 'user-123',
          });

          unauthorizedSocket.on('error', error => {
            expect(error.message).toBe('Unauthorized');
            unauthorizedSocket.disconnect();
            resolve();
          });
        });
      });
    });
  });
});
