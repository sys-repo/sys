import { CrdtServer } from '@sys/driver-automerge/wss';
CrdtServer.start({ port: 8080, dir: '.tmp/wss' });
