import { Server } from '@sys/driver-automerge/wss';

Server.sync({
  port: 3030,
  dir: '.tmp/wss',
});
