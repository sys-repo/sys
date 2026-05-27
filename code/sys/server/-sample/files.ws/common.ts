import type * as t from './t.ts';

export type { t };

/**
 * Libraries:
 */
export { Fs } from '@sys/fs';
export { Files } from '@sys/model/files/fs';
export { Process } from '@sys/process';
export { FilesServer } from '@sys/server/files';

/**
 * Sample default values.
 */
const port = 1234;
export const DEFAULTS = {
  name: '@sys/server:sample:files:ws',
  path: '/files',
  port,
  url: `ws://127.0.0.1:${port}/files`,
} as const;

/** Short alias for sample defaults. */
export const D = DEFAULTS;
