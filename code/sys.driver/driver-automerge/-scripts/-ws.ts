import { Server } from '@sys/driver-automerge/ws';

Server.ws({
  port: 3030,
  dir: '.tmp/sync.crdt',
});
