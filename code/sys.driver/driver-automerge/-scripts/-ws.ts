import { Server } from '@sys/driver-automerge/wss';

Server.start({
  port: 3030,
  dir: '.tmp/wss',
});
