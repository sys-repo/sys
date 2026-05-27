import type * as t from './t.ts';

export type { t };

/**
 * Libraries:
 */
export { Fs } from '@sys/fs';
export { HttpStatic } from '@sys/http/server/static';
export { Files } from '@sys/model/files';
export { FilesStatic } from '@sys/model/files/static';
export { Pkg } from '@sys/std/pkg';

/**
 * Sample default values.
 */
const port = 1235;
export const DEFAULTS = {
  name: '@sys/server:sample:files:http:static',
  port,
  url: `http://127.0.0.1:${port}`,
  dist: '/dist.json',
} as const;

/** Short alias for sample defaults. */
export const D = DEFAULTS;
