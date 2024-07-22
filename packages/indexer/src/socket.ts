import { Server } from 'socket.io';

import { Config } from './config';

const io = new Server(Config.WEBSOCKET_PORT, {
  cors: {
    origin: Config.WEBSOCKET_CORS_ORIGIN,
  },
});

interface JobStatus {
  id: string;
  status: string;
  error: boolean;
}

io.on('connection', (socket) => {
  console.log('[*] A client connected');

  socket.on('job-status', (data: JobStatus) => {
    const { id, status, error } = data;
    io.emit(`job-${id}`, { status, error });
    if (error) {
      console.error(`[-] Job ${id} failure event: ${status}`);
    } else {
      console.log(`[+] Job ${id} success event: ${status}`);
    }
  });
});
