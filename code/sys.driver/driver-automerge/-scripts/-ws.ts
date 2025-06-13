import { Server } from '@sys/driver-automerge/ws';

Server.wss({
  port: 3030,
  dir: '.tmp/sync.crdt',
});
