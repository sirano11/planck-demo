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
  txHash?: string;
}

io.on('connection', (socket) => {
  console.log('[*] A client connected');

  socket.on('job-status', (data: JobStatus) => {
    io.emit(`job-${data.id}`, data);
    if (data.error) {
      console.error(`[-] Job ${data.id} failure event: ${data.status}`);
    } else {
      console.log(
        `[+] Job ${data.id} success event: ${data.status}` +
          `${data.txHash ? ` (${data.txHash})` : ''}`,
      );
    }
  });
});
