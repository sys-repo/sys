export * from '../common.ts';
export { c, Cli } from '@sys/cli';
export { Fs } from '@sys/fs';
export { Process } from '@sys/process';
export { Is } from '@sys/std/is/server';

const localhost = '127.0.0.1';
const publicHost = '0.0.0.0';

/** Default values for the WebSocket server primitive. */
export const DEFAULTS = {
  public: { hostname: publicHost },
  local: { hostname: localhost },
  serve: { hostname: localhost, port: 0 },
  path: '/',
  close: { code: 1001, reason: 'Server closing' },
  status: { kind: 'websocket:cmd', urlLabel: 'websocket' },
  socketHookFailure: { code: 1011, reason: 'Socket hook failed' },
  DisposeReason: {
    serverFinished: 'server.finished',
    socketClose: 'socket.close',
  },
} as const;

/** Short local alias for module defaults. */
export const D = DEFAULTS;
