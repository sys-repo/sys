import type * as t from './t.ts';

export type { t };

/**
 * Libraries:
 */
export { Fs } from '@sys/fs';
export { HttpCmd } from '@sys/http/cmd';
export { HttpServer } from '@sys/http/server';
export { Files } from '@sys/model/files/fs';
export { Process } from '@sys/process';

/**
 * Sample default values.
 */
const port = 1236;
export const DEFAULTS = {
  name: '@sys/server:sample:files:http',
  path: '/files',
  port,
  url: `http://127.0.0.1:${port}/files`,
} as const;

/** Short alias for sample defaults. */
export const D = DEFAULTS;
