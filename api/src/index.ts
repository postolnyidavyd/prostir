import { createServer } from 'node:http';

import { app } from './app.js';
import { env } from './config/env.js';
import { attachRealtime } from './realtime/hub.js';

// явний http-сервер, щоб повісити вебсокет
const server = createServer(app);
attachRealtime(server);
server.listen(env.API_PORT);
