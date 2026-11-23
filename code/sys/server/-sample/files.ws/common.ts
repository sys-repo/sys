export type * as t from './t.ts';

/**
 * Libraries:
 */
export { Cli } from '@sys/cli';
export { Fs } from '@sys/fs';
export { Files } from '@sys/model/files/fs';
export { Net } from '@sys/net';
export { Process } from '@sys/process';
export { FilesServer } from '@sys/server/files';

/**
 * Sample default values.
 */
export const DEFAULTS = {
  name: 'sample:files:ws',
  path: '/files',
  port: 1234,
  env: { port: 'SYS_SERVER_FILES_WS_PORT' },
} as const;

/** Short alias for sample defaults. */
export const D = DEFAULTS;
