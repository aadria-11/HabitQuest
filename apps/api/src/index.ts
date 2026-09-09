import http from 'http';
import { createApp } from './app.js';
import { setupSocketIO, setSocketIO } from './sockets/index.js';
import { getEnv } from './config/env.js';

const env = getEnv();
const app = createApp();
const server = http.createServer(app);
const io = setupSocketIO(server);
setSocketIO(io);

server.listen(env.API_PORT, () => {
  console.log(`API server running on port ${env.API_PORT}`);
});
