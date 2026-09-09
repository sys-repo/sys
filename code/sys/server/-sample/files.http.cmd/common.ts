import type * as t from './t.ts';

export type { t };

/**
 * Libraries:
 */
export { Cli } from '@sys/cli';
export { Fs, Pkg } from '@sys/fs';
export { HttpCmd } from '@sys/http/cmd';
export { HttpServer } from '@sys/http/server';
export { Files } from '@sys/model/files';
export { FilesStatic } from '@sys/model/files/static';
export { FilesServer } from '@sys/server/files';
export { Process } from '@sys/process';
export { Num } from '@sys/std/num';
export { Str } from '@sys/std/str';

/**
 * Sample default values.
 */
const port = 1236;
export const DEFAULTS = {
  name: 'sample:files:http:cmd',
  path: '/files',
  port,
  url: `http://127.0.0.1:${port}/files`,
  env: { port: 'SYS_SERVER_FILES_HTTP_CMD_PORT' },
} as const;

/** Short alias for sample defaults. */
export const D = DEFAULTS;
