import type * as t from './t.ts';

export type { t };

/**
 * Libraries:
 */
export { c, Cli } from '@sys/cli';
export { Fs } from '@sys/fs';
export { HttpServer } from '@sys/http/server';
export { Files } from '@sys/model/files/fs';
export { Process } from '@sys/process';
export { FilesServer } from '@sys/server/files';
export { Str } from '@sys/std/str';

/**
 * Sample default values.
 */
export const DEFAULTS = {
  name: '@sys/server • sample:files',
  port: 1234,
  path: '/files',
  url: 'ws://127.0.0.1:1234/files' as t.StringUrl,
} as const;

/** Short alias for sample defaults. */
export const D = DEFAULTS;
