import { CrdtServer } from '@sys/driver-automerge/wss';

CrdtServer.start({
  port: 3030,
  dir: '.tmp/wss',
});
