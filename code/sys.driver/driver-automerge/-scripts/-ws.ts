import { Server } from '@sys/driver-automerge/server';

Server.ws({
  port: 3030,
  dir: '.tmp/sync.crdt',
});
