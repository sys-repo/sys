import { Server } from '@sys/driver-automerge/wss';

Server.wss({
  port: 3030,
  dir: '.tmp/wss.crdt',
});
